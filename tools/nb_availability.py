#!/usr/bin/env python3
"""Pull per-villa availability from NightsBridge's public booking-engine API into a small JSON file,
plus Villa Afrika (Istria) from Lodgify's public booking-calendar feed.

Read-only: it makes the same anonymous availability requests that book.nightsbridge.com/25208 and the public
Lodgify booking pages (funkeyvillasistria.lodgify.com / checkout.lodgify.com) make for any visitor.
No login, no API key and no write calls, and it never changes rates or settings.
Prices are deliberately NOT stored, so the website can never show a stale rate.

Usage:  python3 nb_availability.py --out assets/data/availability.json [--days 366] [--heartbeat-hours 6]
Standard library only, so it runs on a bare GitHub Actions runner.
"""
import argparse, datetime as dt, json, os, sys, time, urllib.request

BBID = 25208
API = "https://www.nightsbridge.com/bridge/api/5.0/availgrid"
CHUNK = 60  # the API returns at most ~61 days per call

def _post(start, end):
    body = json.dumps({"bbid": BBID, "nbid": 0, "extbbid": "", "clientloginkey": None, "startdate": start, "enddate": end,
                       "bbrtid": 0, "rtgroupid": 0, "nightsbridge": True, "showroomcount": False, "showrates": False,
                       "showextras": False}).encode()
    req = urllib.request.Request(API, body, {"Content-Type": "application/json", "Accept": "application/json", "bbid": str(BBID),
                                             "Origin": "https://book.nightsbridge.com", "Referer": "https://book.nightsbridge.com/",
                                             "User-Agent": "Mozilla/5.0 (FunkeyVillas availability sync)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                d = json.load(r)
            if not d.get("success"): raise RuntimeError(f"NightsBridge error: {d.get('error')}")
            return d["data"]
        except Exception:
            if attempt == 2: raise
            time.sleep(3 * (attempt + 1))

def sast_today():
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=2)).date()  # property time (SAST, no DST)

def fetch(days=366):
    start = sast_today()
    rooms = {}
    s = start
    while s < start + dt.timedelta(days=days):
        e = s + dt.timedelta(days=CHUNK)
        g = _post(s.isoformat(), e.isoformat())
        g0 = dt.date.fromisoformat(g["startdate"])
        for rt in g["roomtypes"]:
            r = rooms.setdefault(str(rt["rtid"]), {"name": rt.get("rtname", ""), "d": {}})
            for i, a in enumerate(rt.get("availability") or []):
                day = g0 + dt.timedelta(days=i)
                if start <= day < start + dt.timedelta(days=days):
                    r["d"][day] = a
        s = e
    out = {}
    for rtid, r in rooms.items():
        free, ms, noarr, nodep = [], [], [], []
        for i in range(days):
            a = r["d"].get(start + dt.timedelta(days=i))
            if a is None:
                free.append("x"); ms.append(0); noarr.append("0"); nodep.append("0"); continue
            co = a.get("closeoutrs") or {}
            typ = str(co.get("closeouttype") or "").upper()
            closed = bool(co.get("closedout"))
            na = closed and "ARRIV" in typ
            nd = closed and "DEPART" in typ
            fully_closed = closed and not (na or nd)
            free.append("1" if (a.get("noroomsfree") or 0) > 0 and not fully_closed else "0")
            ms.append(int(a.get("minstay") or 0))
            noarr.append("1" if na else "0"); nodep.append("1" if nd else "0")
        out[rtid] = {"name": r["name"], "free": "".join(free), "minstay": ms, "noarr": "".join(noarr), "nodep": "".join(nodep)}
    return {"source": f"NightsBridge public availability, BBID {BBID}", "bbid": BBID, "start": start.isoformat(), "days": days,
            "checked": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"), "rooms": out}

# ---- Villa Afrika (Lodgify) ----
# The calendar feed behind Lodgify's own public date picker (checkout.lodgify.com and the /en/availability page).
# Anonymous GET, about 90 days per call. Stored as one more entry in "rooms", with its own start/checked so that a
# failed Lodgify call can keep the previous Afrika data (and its age) without touching the Camps Bay data.
LG_SLUG, LG_PROPERTY, LG_ROOM = "funkeyvillasistria", 607614, 674459
LG_KEY = f"lodgify-{LG_PROPERTY}"
LG_API = f"https://checkout.lodgify.com/api/v2/websites/{LG_SLUG}/rentals/{LG_PROPERTY}/calendar"

def zagreb_today():
    try:
        from zoneinfo import ZoneInfo
        return dt.datetime.now(ZoneInfo("Europe/Zagreb")).date()
    except Exception:
        return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)).date()

def _lg_get(start):
    req = urllib.request.Request(f"{LG_API}?startDate={start}&roomId={LG_ROOM}",
                                 headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0 (FunkeyVillas availability sync)",
                                          "Referer": f"https://{LG_SLUG}.lodgify.com/"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)["calendar"]
        except Exception:
            if attempt == 2: raise
            time.sleep(3 * (attempt + 1))

def fetch_lodgify(days=366):
    start = zagreb_today()
    got, s = {}, start
    while s < start + dt.timedelta(days=days):
        cal = _lg_get(s.isoformat())
        if not cal: break
        for c in cal: got[c["date"]] = c
        nxt = dt.date.fromisoformat(cal[-1]["date"]) + dt.timedelta(days=1)
        if nxt <= s: break
        s = nxt
    if not got: raise RuntimeError("Lodgify returned no calendar days")
    free, ms, noarr, nodep = [], [], [], []
    for i in range(days):
        c = got.get((start + dt.timedelta(days=i)).isoformat())
        if c is None:
            free.append("x"); ms.append(0); noarr.append("0"); nodep.append("0"); continue
        ok = bool(c.get("isAvailable"))
        free.append("1" if ok else "0")
        ms.append(int(c.get("minimalStay") or 0))
        noarr.append("1" if ok and not c.get("isCheckInAvailable") else "0")   # free night, but no arrival allowed
        nodep.append("0" if c.get("isCheckOutAvailable") else "1")
    return {"name": "Villa Afrika", "source": f"Lodgify public booking calendar, {LG_SLUG} / {LG_PROPERTY}",
            "start": start.isoformat(), "tz": "Europe/Zagreb",
            "checked": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "free": "".join(free), "minstay": ms, "noarr": "".join(noarr), "nodep": "".join(nodep)}

def _strip_checked(d):
    """Compare two files ignoring the sync timestamps (top level and per room)."""
    d = {k: v for k, v in d.items() if k != "checked"}
    d["rooms"] = {k: {kk: vv for kk, vv in (v or {}).items() if kk != "checked"} for k, v in (d.get("rooms") or {}).items()}
    return d

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--days", type=int, default=366)
    ap.add_argument("--heartbeat-hours", type=float, default=0,
                    help="if the data is unchanged and the file was checked less than N hours ago, leave it untouched (fewer commits)")
    a = ap.parse_args()
    new = fetch(a.days)
    if not new["rooms"]:
        sys.exit("no room types returned; keeping the existing file")
    old = None
    if os.path.exists(a.out):
        try: old = json.load(open(a.out))
        except Exception: old = None
    try:
        new["rooms"][LG_KEY] = fetch_lodgify(a.days)
    except Exception as e:  # never let Lodgify break the Camps Bay sync; keep the last good Afrika data (it ages out in avcal.js)
        prev = ((old or {}).get("rooms") or {}).get(LG_KEY)
        print(f"Lodgify fetch failed ({e}); " + ("keeping the previous Villa Afrika data" if prev else "no Villa Afrika data"), file=sys.stderr)
        if prev: new["rooms"][LG_KEY] = prev
    if old and a.heartbeat_hours:
        same = _strip_checked(old) == _strip_checked(new)
        try: age_h = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(old["checked"].replace("Z", "+00:00"))).total_seconds() / 3600
        except Exception: age_h = 1e9
        if same and age_h < a.heartbeat_hours:
            print(f"unchanged (checked {age_h:.1f} h ago), file left as is"); return
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    tmp = a.out + ".tmp"
    with open(tmp, "w") as f: json.dump(new, f, separators=(",", ":"))
    os.replace(tmp, a.out)
    print("wrote", a.out, {k: v["free"][:30] for k, v in new["rooms"].items()})

if __name__ == "__main__":
    main()
