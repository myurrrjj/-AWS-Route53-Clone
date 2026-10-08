import random
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import DnsRecord, HostedZone, User
from ..schemas import (
    PaginatedZones,
    ZoneCreate,
    ZoneOut,
    ZoneUpdate,
)

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])

ALPHABET = string.ascii_uppercase + string.digits


def new_zone_id() -> str:
    return "Z" + "".join(random.choice(ALPHABET) for _ in range(13))


def new_caller_reference() -> str:
    return "".join(random.choice("0123456789abcdef") for _ in range(32))


def nameservers(zone_name: str) -> str:
    return "ns-1.awsdns-00.com."


def to_out(zone: HostedZone, count: int) -> ZoneOut:
    return ZoneOut(
        id=zone.id,
        name=zone.name,
        comment=zone.comment,
        type=zone.type,
        private_zone=zone.private_zone,
        caller_reference=zone.caller_reference,
        created_at=zone.created_at,
        record_count=count,
    )


def count_records(db: Session, zone_id: str) -> int:
    return db.scalar(select(func.count(DnsRecord.id)).where(DnsRecord.zone_id == zone_id)) or 0


def get_zone_or_404(db: Session, zone_id: str) -> HostedZone:
    zone = db.get(HostedZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")
    return zone


@router.get("", response_model=PaginatedZones)
def list_zones(
    q: str = Query("", description="search by name or comment"),
    type: str = Query("", description="Public or Private"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("name"),
    order: str = Query("asc"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    stmt = select(HostedZone)
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(HostedZone.name).like(like), func.lower(HostedZone.comment).like(like)))
    if type in ("Public", "Private"):
        stmt = stmt.where(HostedZone.type == type)

    column = HostedZone.name if sort == "name" else HostedZone.created_at
    stmt = stmt.order_by(column.desc() if order == "desc" else column.asc())

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    items = [to_out(z, count_records(db, z.id)) for z in rows]
    pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedZones(items=items, total=total, page=page, page_size=page_size, pages=pages)


@router.get("/{zone_id}", response_model=ZoneOut)
def get_zone(zone_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    zone = get_zone_or_404(db, zone_id)
    return to_out(zone, count_records(db, zone.id))


@router.post("", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
def create_zone(payload: ZoneCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if db.scalar(select(HostedZone).where(HostedZone.name == payload.name)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A hosted zone with that name already exists")
    zone = HostedZone(
        id=new_zone_id(),
        name=payload.name,
        comment=payload.comment or "",
        type=payload.type,
        private_zone=payload.type == "Private",
        caller_reference=new_caller_reference(),
    )
    db.add(zone)
    db.flush()

    db.add(DnsRecord(zone_id=zone.id, name=zone.name, type="NS", ttl=172800, value=nameservers(zone.name)))
    db.add(
        DnsRecord(
            zone_id=zone.id,
            name=zone.name,
            type="SOA",
            ttl=900,
            value=f"ns-1.awsdns-00.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
        )
    )
    db.commit()
    db.refresh(zone)
    return to_out(zone, count_records(db, zone.id))


@router.patch("/{zone_id}", response_model=ZoneOut)
def update_zone(
    zone_id: str,
    payload: ZoneUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone = get_zone_or_404(db, zone_id)
    if payload.comment is not None:
        zone.comment = payload.comment
    if payload.type is not None:
        if payload.type not in ("Public", "Private"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="type must be Public or Private")
        zone.type = payload.type
        zone.private_zone = payload.type == "Private"
    db.commit()
    db.refresh(zone)
    return to_out(zone, count_records(db, zone.id))


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    zone = get_zone_or_404(db, zone_id)
    db.delete(zone)
    db.commit()
    return None


@router.get("/{zone_id}/export")
def export_zone(
    zone_id: str,
    format: str = Query("json", pattern="^(json|bind)$"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    zone = get_zone_or_404(db, zone_id)
    records = db.scalars(select(DnsRecord).where(DnsRecord.zone_id == zone.id).order_by(DnsRecord.name)).all()
    if format == "json":
        return {
            "zone": {"id": zone.id, "name": zone.name, "comment": zone.comment, "type": zone.type},
            "records": [
                {"name": r.name, "type": r.type, "ttl": r.ttl, "value": r.value, "routing_policy": r.routing_policy}
                for r in records
            ],
        }
    lines = [f"$ORIGIN {zone.name}", "$TTL 300"]
    for r in records:
        lines.append(f"{r.name}\t{r.ttl}\tIN\t{r.type}\t{r.value}")
    return {"format": "bind", "content": "\n".join(lines)}
