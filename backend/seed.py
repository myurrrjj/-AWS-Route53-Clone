from app.database import Base, SessionLocal, engine
from app.models import DnsRecord, HostedZone, User
from app.routers.zones import nameservers, new_caller_reference, new_zone_id
from app.security import hash_password

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "password123"


def build():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = User(
            email=DEMO_EMAIL,
            name="Demo User",
            password_hash=hash_password(DEMO_PASSWORD),
            account_id="123456789012",
        )
        db.add(user)

        samples = [
            ("example.com.", "Primary public zone for example.com", "Public", [
                ("www.example.com.", "A", 300, "192.0.2.10"),
                ("www.example.com.", "A", 300, "192.0.2.11"),
                ("api.example.com.", "A", 60, "192.0.2.20"),
                ("mail.example.com.", "MX", 3600, "10 inbound-smtp.example.com."),
                ("_sip._tcp.example.com.", "SRV", 300, "10 60 5060 sipserver.example.com."),
                ("example.com.", "TXT", 300, '"v=spf1 include:_spf.example.com ~all"'),
            ]),
            ("staging.example.com.", "Staging environment", "Public", [
                ("app.staging.example.com.", "CNAME", 300, "www.example.com."),
                ("db.staging.example.com.", "A", 120, "198.51.100.5"),
            ]),
            ("internal.example.com.", "Private zone for internal services", "Private", [
                ("cache.internal.example.com.", "A", 60, "10.0.0.15"),
                ("internal.example.com.", "CAA", 3600, '0 issue "amazon.com"'),
            ]),
            ("example.org.", "Secondary domain", "Public", [
                ("example.org.", "AAAA", 300, "2001:db8::1"),
                ("blog.example.org.", "CNAME", 300, "www.example.com."),
            ]),
        ]

        for name, comment, ztype, recs in samples:
            zone = HostedZone(
                id=new_zone_id(),
                name=name,
                comment=comment,
                type=ztype,
                private_zone=ztype == "Private",
                caller_reference=new_caller_reference(),
            )
            db.add(zone)
            db.flush()
            db.add(DnsRecord(zone_id=zone.id, name=name, type="NS", ttl=172800, value=nameservers(name)))
            db.add(
                DnsRecord(
                    zone_id=zone.id,
                    name=name,
                    type="SOA",
                    ttl=900,
                    value="ns-1.awsdns-00.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
                )
            )
            for rname, rtype, ttl, value in recs:
                db.add(DnsRecord(zone_id=zone.id, name=rname, type=rtype, ttl=ttl, value=value))

        db.commit()
        print(f"Seeded user {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"Seeded {len(samples)} hosted zones")
    finally:
        db.close()


if __name__ == "__main__":
    build()
