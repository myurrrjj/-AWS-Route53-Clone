from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    account_id: Mapped[str] = mapped_column(String(32), default="123456789012")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    comment: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(16), default="Public")
    private_zone: Mapped[bool] = mapped_column(default=False)
    caller_reference: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    records: Mapped[list["DnsRecord"]] = relationship(
        back_populates="zone",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DnsRecord(Base):
    __tablename__ = "dns_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(8), nullable=False)
    ttl: Mapped[int] = mapped_column(Integer, default=300)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    routing_policy: Mapped[str] = mapped_column(String(32), default="Simple")
    set_identifier: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    zone: Mapped["HostedZone"] = relationship(back_populates="records")
