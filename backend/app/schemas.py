from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]
ROUTING_POLICIES = ["Simple", "Weighted", "Latency", "Failover", "Geolocation", "Multivalue"]
ZONE_TYPES = ["Public", "Private"]


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    account_id: str


class ZoneBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    comment: str = ""
    type: str = "Public"

    @field_validator("name")
    @classmethod
    def clean_name(cls, v):
        v = v.strip().lower()
        if not v.endswith("."):
            v = v + "."
        return v

    @field_validator("type")
    @classmethod
    def clean_type(cls, v):
        if v not in ZONE_TYPES:
            raise ValueError("type must be Public or Private")
        return v


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    comment: Optional[str] = None
    type: Optional[str] = None


class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    comment: str
    type: str
    private_zone: bool
    caller_reference: str
    created_at: datetime
    record_count: int = 0


class RecordBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str
    ttl: int = 300
    value: str = ""
    routing_policy: str = "Simple"
    set_identifier: str = ""

    @field_validator("type")
    @classmethod
    def clean_record_type(cls, v):
        v = v.strip().upper()
        if v not in RECORD_TYPES:
            raise ValueError(f"type must be one of {', '.join(RECORD_TYPES)}")
        return v

    @field_validator("routing_policy")
    @classmethod
    def clean_policy(cls, v):
        if v not in ROUTING_POLICIES:
            raise ValueError(f"routing_policy must be one of {', '.join(ROUTING_POLICIES)}")
        return v

    @field_validator("ttl")
    @classmethod
    def clean_ttl(cls, v):
        if v < 0 or v > 2147483647:
            raise ValueError("ttl must be between 0 and 2147483647")
        return v

    @field_validator("value")
    @classmethod
    def clean_value(cls, v):
        return v.strip()


class RecordCreate(RecordBase):
    pass


class RecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = None
    value: Optional[str] = None
    routing_policy: Optional[str] = None
    set_identifier: Optional[str] = None


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    set_identifier: str
    created_at: datetime


class PaginatedZones(BaseModel):
    items: list[ZoneOut]
    total: int
    page: int
    page_size: int
    pages: int


class PaginatedRecords(BaseModel):
    items: list[RecordOut]
    total: int
    page: int
    page_size: int
    pages: int
