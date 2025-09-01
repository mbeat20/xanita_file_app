import hashlib
from pathlib import Path
from typing import Union
from psycopg import Cursor
import os
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

ROOTS = [Path(r"X:\\"), Path(r"U:\XConverting3")]

def make_uid(filepath: Union[str, Path]) -> str:
    """
    Build a stable UID from the normalized file path.
    We lowercase and use / as separator so the same file gets the same UID.
    """
    p = Path(filepath)
    norm = p.as_posix().lower()
    h = hashlib.sha256(norm.encode("utf-8")).hexdigest()
    return h[:12]  # short but plenty unique for your corpus

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
              filepath = EXCLUDED.filepath;
        """,
        (uid, job_name, str(filepath)),
    )
    return uid

def scan_and_upsert():
    dsn = os.environ["DATABASE_URL"]  # set this first (see step 4)
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

if __name__ == "__main__":
    scan_and_upsert()
