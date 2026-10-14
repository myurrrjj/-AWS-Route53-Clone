from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import DnsRecord, HostedZone, User
from ..schemas import PaginatedRecords, RecordCreate, RecordOut, RecordUpdate

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["dns-records"])


def zone_or_404(db: Session, zone_id: str) -> HostedZone:
    zone = db.get(HostedZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")
    return zone


def record_or_404(db: Session, zone_id: str, record_id: int) -> DnsRecord:
    record = db.get(DnsRecord, record_id)
    if record is None or record.zone_id != zone_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


def normalize_name(name: str, zone_name: str) -> str:
    name = name.strip()
    if name in ("", "@"):
        return zone_name
    if name.endswith("."):
        return name
    if name == zone_name.rstrip(".") or name.endswith("." + zone_name.rstrip(".")):
        return name + "."
    if "." in name:
        return name + "."
    return name + "." + zone_name


@router.get("", response_model=PaginatedRecords)
def list_records(
    zone_id: str,
    q: str = Query("", description="search by name or value"),
    type: str = Query("", description="record type filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("name"),
    order: str = Query("asc"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone = zone_or_404(db, zone_id)
    stmt = select(DnsRecord).where(DnsRecord.zone_id == zone.id)
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(DnsRecord.name).like(like), func.lower(DnsRecord.value).like(like)))
    if type:
        stmt = stmt.where(DnsRecord.type == type.strip().upper())

    column = DnsRecord.name if sort == "name" else DnsRecord.ttl
    stmt = stmt.order_by(column.desc() if order == "desc" else column.asc())

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedRecords(items=rows, total=total, page=page, page_size=page_size, pages=pages)


@router.get("/{record_id}", response_model=RecordOut)
def get_record(zone_id: str, record_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    zone_or_404(db, zone_id)
    return record_or_404(db, zone_id, record_id)


@router.post("", response_model=RecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: str,
    payload: RecordCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone = zone_or_404(db, zone_id)
    record = DnsRecord(
        zone_id=zone.id,
        name=normalize_name(payload.name, zone.name),
        type=payload.type,
        ttl=payload.ttl,
        value=payload.value,
        routing_policy=payload.routing_policy,
        set_identifier=payload.set_identifier,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{record_id}", response_model=RecordOut)
def update_record(
    zone_id: str,
    record_id: int,
    payload: RecordUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone = zone_or_404(db, zone_id)
    record = record_or_404(db, zone_id, record_id)
    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        record.name = normalize_name(data["name"], zone.name)
    
    if "type" in data:
        record.type = data["type"]

    if "ttl" in data:
        record.ttl = data["ttl"]
    if "value" in data:
        record.value = data["value"].strip()
    if "routing_policy" in data:
        record.routing_policy = data["routing_policy"]
    if "set_identifier" in data:
        record.set_identifier = data["set_identifier"]
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(zone_id: str, record_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    zone_or_404(db, zone_id)
    record = record_or_404(db, zone_id, record_id)
    db.delete(record)
    db.commit()
    return None


@router.post("/bulk-delete")
def bulk_delete(
    zone_id: str,
    ids: list[int],
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone_or_404(db, zone_id)
    if not ids:
        return {"deleted": 0}
    rows = db.scalars(select(DnsRecord).where(DnsRecord.zone_id == zone_id, DnsRecord.id.in_(ids))).all()
    for r in rows:
        db.delete(r)
    db.commit()
    return {"deleted": len(rows)}


class BindPayload(BaseModel):
    content: str = ""


@router.post("/import-bind")
def import_bind(
    zone_id: str,
    payload: BindPayload,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone = zone_or_404(db, zone_id)
    content = payload.content
    origin = zone.name
    default_ttl = 300
    created = 0
    for raw in content.splitlines():
        line = raw.strip()
        if not line or line.startswith(";"):
            continue
        if line.upper().startswith("$ORIGIN"):
            parts = line.split()
            if len(parts) > 1:
                origin = parts[1] if parts[1].endswith(".") else parts[1] + "."
            continue
        if line.upper().startswith("$TTL"):
            parts = line.split()
            if len(parts) > 1 and parts[1].isdigit():
                default_ttl = int(parts[1])
            continue
        fields = line.replace("\t", " ").split()
        if len(fields) < 4:
            continue
        name, ttl_field, cls, rtype = fields[0], fields[1], fields[2], fields[3]
        if ttl_field.isdigit():
            ttl = int(ttl_field)
            rest = fields[4:]
        else:
            ttl = default_ttl
            rest = fields[3:]
            rtype = cls
        rtype = rtype.upper()
        value = " ".join(rest)
        if not value:
            continue
        db.add(
            DnsRecord(
                zone_id=zone.id,
                name=normalize_name(name, zone.name),
                type=rtype,
                ttl=ttl,
                value=value,
            )
        )
        created += 1
    db.commit()
    return {"imported": created}
