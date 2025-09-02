import hashlib
from pathlib import Path
from typing import Union
from psycopg import Cursor
import os
from pathlib import Path
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

ROOTS = [Path(r"X:\\")]

from urllib.parse import urlparse

# Load the .env that sits NEXT TO this file
load_dotenv(dotenv_path=Path(__file__).with_name('.env'))

DB_DSN = (os.getenv("DATABASE_URL") or "").strip().strip('"').strip("'")
print("DSN loaded:", bool(DB_DSN), "len:", len(DB_DSN))
try:
    u = urlparse(DB_DSN)
    print("DB host:", u.hostname, "port:", u.port, "scheme:", u.scheme)
except Exception as e:
    print("Could not parse DSN:", e)

load_dotenv(dotenv_path=Path(__file__).with_name('.env'))

DB_DSN = os.getenv("DATABASE_URL")
if not DB_DSN:
    raise RuntimeError("DATABASE_URL is not set. Add it to services/mu_extractor/.env")

def make_uid(filepath: Union[str, Path]) -> str:
    """
    Build a stable UID from the normalized file path.
    We lowercase and use / as separator so the same file gets the same UID.
    """
    p = Path(filepath)
    norm = p.as_posix().lower()
    h = hashlib.sha256(norm.encode("utf-8")).hexdigest()
    return h[:6]  

def upsert_location(cur: Cursor, job_name: str, filepath: Union[str, Path]) -> str:
    """
    Upsert (uid, job_name, filepath) into mu_locations.
    Returns the uid for convenience.
    """
    uid = make_uid(filepath)
    cur.execute(
        """
        INSERT INTO mu_locations (uid, job_name, filepath)
        VALUES (%s, %s, %s)
        ON CONFLICT (uid) DO UPDATE
          SET job_name = EXCLUDED.job_name,
              filepath = EXCLUDED.filepath,
              updated_at = now();
        """,
        (uid, job_name, str(filepath)),
    )
    return uid

def scan_and_upsert(dsn=DB_DSN):
    total = 0
    with psycopg.connect(dsn, row_factory=dict_row) as con, con.cursor() as cur:
        for root in ROOTS:
            if not root.exists():
                continue
            for job_dir in (p for p in root.iterdir() if p.is_dir()):
                job_name = job_dir.name
                mufh_dir = job_dir / "sales" / "Material usages and Factory handover"
                if not mufh_dir.is_dir():
                    continue
                for f in mufh_dir.iterdir():
                    if f.is_file() and f.suffix.lower() in (".xlsx", ".xls"):
                        upsert_location(cur, job_name=job_name, filepath=f)
                        total += 1
        con.commit()
    print(f"mu_locator: upserted {total} rows into mu_locations")


scan_and_upsert(DB_DSN)
