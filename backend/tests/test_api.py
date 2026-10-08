from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)

assert c.get("/api/health").json() == {"status": "ok"}
assert c.get("/api/hosted-zones").status_code == 401

r = c.post("/api/auth/login", json={"email": "demo@example.com", "password": "password123"})
assert r.status_code == 200, r.text
assert r.json()["email"] == "demo@example.com"
assert c.get("/api/auth/me").status_code == 200

r = c.get("/api/hosted-zones")
assert r.status_code == 200
body = r.json()
assert body["total"] >= 4, body
print("zones total:", body["total"], "pages:", body["pages"])

r = c.get("/api/hosted-zones", params={"q": "staging"})
assert r.json()["total"] == 1, r.text
zid = r.json()["items"][0]["id"]

r = c.post("/api/hosted-zones", json={"name": "Test.Example.Com", "comment": "made in test", "type": "Public"})
assert r.status_code == 201, r.text
new = r.json()
assert new["name"] == "test.example.com."
assert new["record_count"] == 2
print("created zone", new["id"], new["name"], "records:", new["record_count"])

r = c.patch(f"/api/hosted-zones/{new['id']}", json={"comment": "updated"})
assert r.json()["comment"] == "updated"

r = c.post(f"/api/hosted-zones/{new['id']}/records", json={
    "name": "www", "type": "a", "ttl": 300, "value": "192.0.2.99"
})
assert r.status_code == 201, r.text
rec = r.json()
assert rec["type"] == "A" and rec["name"] == "www.test.example.com."
print("created record", rec["id"], rec["name"], rec["type"])

r = c.patch(f"/api/hosted-zones/{new['id']}/records/{rec['id']}", json={"value": "192.0.2.100"})
assert r.json()["value"] == "192.0.2.100"

r = c.get(f"/api/hosted-zones/{new['id']}/records", params={"type": "A", "page_size": 5})
assert r.json()["total"] == 1, r.text

r = c.post(f"/api/hosted-zones/{new['id']}/records/import-bind", json={
    "content": "$ORIGIN test.example.com.\n$TTL 600\nwww 600 IN A 192.0.2.200\nmail 3600 IN MX 10 mail.test.example.com.\n"
})
assert r.json()["imported"] == 2, r.text

r = c.get(f"/api/hosted-zones/{new['id']}/export", params={"format": "bind"})
assert "IN" in r.json()["content"]

r = c.get(f"/api/hosted-zones/{new['id']}/export", params={"format": "json"})
assert "records" in r.json()

r = c.delete(f"/api/hosted-zones/{new['id']}/records/{rec['id']}")
assert r.status_code == 204

r = c.delete(f"/api/hosted-zones/{new['id']}")
assert r.status_code == 204
assert c.get(f"/api/hosted-zones/{new['id']}").status_code == 404

r = c.get("/api/hosted-zones", params={"q": "no-such-zone-xyz"})
assert r.json()["total"] == 0

r = c.post("/api/auth/logout")
assert r.status_code == 200
assert c.get("/api/hosted-zones").status_code == 401

print("ALL BACKEND TESTS PASSED")
