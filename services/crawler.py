import pandas as pd
from pathlib import Path
import re
import random
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import json
import time
import os

# DB_DSN    = "postgresql://postgres:MattB01@localhost:5432/xanita-app"
PROCESS   = "crawler"
ETL_VERSION = 1
BATCH_SIZE  = 1000  # insert watermark in batches of N rows
_ALLOWED_EXTS = {".xlsx", ".ai", ".pdf", ".jpg", ".jpeg", ".3dm"}

servers = ["X:/", "U:/XConverting3/"]

# Regex: start of string ^, "job" case-insensitive, optional space/dash/underscore, then a digit
JOB_FOLDER_RE = re.compile(r'(?i)^job[\s_\-]*\d')
JOB_ID_RE = re.compile(r'(?i)^job[\s._-]*(\d+)')  

def get_conn(dsn):
    return psycopg2.connect(dsn)

def ensure_state_table(conn):
    with conn, conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS etl_state (
          process      text PRIMARY KEY,
          etl_version  int     NOT NULL,
          last_mtime   bigint  NOT NULL,
          last_path    text    NOT NULL,
          updated_at   timestamptz NOT NULL DEFAULT now()
        );
        """)

def load_state_db(conn, process=PROCESS):
    with conn.cursor() as cur:
        cur.execute("SELECT etl_version,last_mtime,last_path FROM etl_state WHERE process=%s", (process,))
        row = cur.fetchone()
    if not row or row[0] != ETL_VERSION:
        # cold start if no row or version mismatch
        return {"etl_version": ETL_VERSION, "last_mtime": 0, "last_path": ""}
    return {"etl_version": row[0], "last_mtime": int(row[1]), "last_path": row[2]}

def save_state_db(conn, last_mtime, last_path, process=PROCESS):
    with conn, conn.cursor() as cur:
        cur.execute("""
          INSERT INTO etl_state(process, etl_version, last_mtime, last_path)
          VALUES (%s,%s,%s,%s)
          ON CONFLICT (process) DO UPDATE
            SET etl_version=EXCLUDED.etl_version,
                last_mtime =EXCLUDED.last_mtime,
                last_path  =EXCLUDED.last_path,
                updated_at =now();
        """, (process, ETL_VERSION, int(last_mtime), last_path))

def file_mtime(p: Path) -> int:
    try:
        return int(p.stat().st_mtime)
    except (FileNotFoundError, PermissionError, OSError):
        return 0
    
def get_job_name(server: str):
    root = Path(server)
    # list only directories one level down
    folders = [p.name for p in root.iterdir() if p.is_dir() and JOB_FOLDER_RE.match(p.name)]
    return sorted(folders)

def get_job_id(job_name: str):
    m = JOB_ID_RE.match(job_name)
    return f"{m.group(1)}" if m else None


def get_mu_sheet(job_root:Path):
    # root = f"{server}/"
    pathfile = sorted(job_root.glob(r"Sales/Material Usages and Factory Handover/**/Job*.xlsx"))
    if pathfile:
        return pathfile
    else:
        return None

def get_cut_file(job_root:Path):
    # root = f"{server}/"
    pathfile_prod = sorted(job_root.glob(r"Design/Cut Files/Production/**/Job*.ai"))
    pathfile_one = sorted(job_root.glob(r"Design/Cut Files/1 Off/**/Job*.ai"))
    if pathfile_prod:
        return pathfile_prod
    elif pathfile_one:
        return pathfile_one
    else:
        return None
    
def get_assembly_instructions(job_root:Path):
    # root = f"{server}/"
    pathfile = sorted(job_root.glob(r"Pics and Assembly/**/Job*.pdf"))
    if pathfile:
        return pathfile
    else:
        return None

def get_pics(job_root:Path):
    # root = f"{server}/"
    pathfile = sorted(job_root.glob(r"Pics and Assembly/**/*.jpg"))
    if pathfile:
        return pathfile
    else:
        return None
    
def get_low_res(job_root:Path):
    # root = f"{server}/"
    pathfile_prod = sorted(job_root.glob(r"Design/Low Res/Production/**/Job*.pdf"))
    pathfile_one = sorted(job_root.glob(r"Design/Low Res/1 Off/**/Job*.pdf"))
    if pathfile_prod:
        return pathfile_prod
    elif pathfile_one:
        return pathfile_one
    else:
        return None
    
def get_print_files(job_root:Path):
    # root = f"{server}/"
    pathfile_prod = sorted(job_root.glob(r"Design/Print Files/Production/**/Job*.pdf"))
    pathfile_one = sorted(job_root.glob(r"Design/Print Files/1 Off/**/Job*.pdf"))
    if pathfile_prod:
        return pathfile_prod
    elif pathfile_one:
        return pathfile_one
    else:
        return None
    
def get_set_up(job_root:Path):
    # root = f"{server}/"
    pathfile_prod = sorted(job_root.glob(r"Design/Set Up/Production/**/Job*.pdf"))
    pathfile_one = sorted(job_root.glob(r"Design/Set Up/1 Off/**/Job*.pdf"))
    if pathfile_prod:
        return pathfile_prod
    elif pathfile_one:
        return pathfile_one
    else:
        return None
    
def get_technical_drawings(job_root:Path):
    # root = f"{server}/"
    pathfile = sorted(job_root.glob(r"Design/Technical drawings/**/*.jpg"))
    if pathfile:
        return pathfile
    else:
        return None
    
def get_3d_files(job_root:Path):
    # root = f"{server}/"
    pathfile = sorted(job_root.glob(r"Design/Technical drawings/**/*.3dm"))
    if pathfile:
        return pathfile
    else:
        return None
    
def get_file_info(job_root: Path):
    p = Path(job_root)
    st = p.stat()
    return datetime.fromtimestamp(st.st_ctime)
    
    
#  FOR TESTING///////////////////////
    
# def sample_first_jobs(servers, n=10):
#     picked = []
#     for server in servers:
#         for j in get_job_name(server):
#             picked.append((Path(server), j))
#             if len(picked) >= n:
#                 return picked
#     return picked

# def sample_random_jobs(servers, n=10, seed=42):
#     all_jobs = []
#     for server in servers:
#         for j in get_job_name(server):
#             all_jobs.append((Path(server), j))
#     random.seed(seed)
#     n = min(n, len(all_jobs))
#     return random.sample(all_jobs, n)
#//////////////////////////////////////////////////////
    
asset_types  = {
    "mu_sheet": get_mu_sheet,
    "cut_file": get_cut_file,
    "assembly_instructions": get_assembly_instructions,
    "pics": get_pics,
    "low_res": get_low_res,
    "print_files": get_print_files,
    "set_up": get_set_up,
    "technical_drawings": get_technical_drawings,
    "3d_file": get_3d_files
}

    
def get_new_assets(servers, last_mtime: int, last_path: str) -> pd.DataFrame:
    rows = []
    last_path_norm = os.path.normcase(last_path)  # tie-breaker normalization

    for server in servers:
        server_root = Path(server)
        jobs = get_job_name(str(server_root))

        for job in jobs:
            job_root = server_root / job
            job_id   = get_job_id(job)
            if not job_id:
                continue

            # single fast scan per job folder
            stack = [job_root]
            while stack:
                dpath = stack.pop()
                try:
                    with os.scandir(dpath) as it:
                        for entry in it:
                            try:
                                if entry.is_dir(follow_symlinks=False):
                                    stack.append(entry.path)
                                    continue

                                name_lower = entry.name.lower()
                                ext = os.path.splitext(name_lower)[1]
                                if ext not in _ALLOWED_EXTS:
                                    continue

                                st = entry.stat(follow_symlinks=False)
                                m  = int(st.st_mtime)

                                p_abs  = entry.path
                                p_norm = os.path.normcase(p_abs)

                                # watermark check (strictly after)
                                if (m < last_mtime) or (m == last_mtime and p_norm <= last_path_norm):
                                    continue

                                # classify path -> your "Type"
                                path_l = p_norm  # already lowercased by normcase
                                is_jobfile = name_lower.startswith("job")
                                rtype = None

                                if ("sales" in path_l and
                                    "material usages and factory handover" in path_l and
                                    is_jobfile and ext == ".xlsx"):
                                    rtype = "mu_sheet"

                                elif ("design" in path_l and "cut files" in path_l and
                                      ("production" in path_l or "1 off" in path_l) and
                                      is_jobfile and ext == ".ai"):
                                    rtype = "cut_file"

                                elif ("pics and assembly" in path_l and
                                      is_jobfile and ext == ".pdf"):
                                    rtype = "assembly_instructions"

                                elif ("pics and assembly" in path_l and
                                      ext in (".jpg", ".jpeg")):
                                    rtype = "pics"

                                elif ("design" in path_l and "low res" in path_l and
                                      ("production" in path_l or "1 off" in path_l) and
                                      is_jobfile and ext == ".pdf"):
                                    rtype = "low_res"

                                elif ("design" in path_l and "print files" in path_l and
                                      ("production" in path_l or "1 off" in path_l) and
                                      is_jobfile and ext == ".pdf"):
                                    rtype = "print_files"

                                elif ("design" in path_l and "set up" in path_l and
                                      ("production" in path_l or "1 off" in path_l) and
                                      is_jobfile and ext == ".pdf"):
                                    rtype = "set_up"

                                elif ("design" in path_l and "technical drawings" in path_l and
                                      ext in (".jpg", ".jpeg")):
                                    rtype = "technical_drawings"

                                elif ("design" in path_l and "technical drawings" in path_l and
                                      ext == ".3dm"):
                                    rtype = "3d_file"

                                if not rtype:
                                    continue

                                rows.append({
                                    "Job ID"     : job_id,
                                    "Job name"   : job,
                                    "Type"       : rtype,
                                    "Path"       : p_abs,
                                    "filename"   : entry.name,
                                    "created_at" : datetime.fromtimestamp(m),
                                    "mtime_epoch": m,
                                })
                            except Exception:
                                # skip unreadable entry, keep going
                                continue
                except Exception:
                    # skip unreadable directory
                    continue

    # deterministic order (matches watermark tie-breaker)
    rows.sort(key=lambda r: (r["mtime_epoch"], os.path.normcase(r["Path"])))
    return pd.DataFrame(rows)

# def get_assets(servers, jobs_sample=None, only_types=None):
#     rows = []
#     if jobs_sample is None:
#         jobs_sample = sample_first_jobs(servers, n=10)  # default sample of 10
#     for server_root, job in jobs_sample:
#         job_root = server_root / job
#         job_id = get_job_id(job)
#         if not job_id:
#             print(f"[skip] could not extract job_id from '{job}'")
#             continue
#         type_items = asset_types.items() if not only_types else [(t, asset_types[t]) for t in only_types]
#         for asset_type, func in type_items:
#             for f in (func(job_root) or []):
#                 rows.append({
#                     "Job ID": job_id,
#                     "Job name": job,
#                     "Type": asset_type,
#                     "Path": str(f),
#                     "filename": f.name
#                 })
#     return pd.DataFrame(rows)

                

    # print(rows)
# df_all = get_assets(servers, jobs_sample=sample_random_jobs(servers, n=10))
def insert_rows(conn, rows):
    # rows is list[dict] with keys: job_id, job_name, resource_type, abs_path, filename, created_at
    data = [
        (r["job_id"], r["job_name"], r["resource_type"], r["abs_path"], r["filename"], r["created_at"])
        for r in rows
    ]
    with conn, conn.cursor() as cur:
        execute_values(cur, """
          INSERT INTO resources (job_id, job_name, resource_type, abs_path, filename, created_at)
          VALUES %s
          ON CONFLICT (abs_path) DO UPDATE
            SET job_id=EXCLUDED.job_id,
                job_name=EXCLUDED.job_name,
                resource_type=EXCLUDED.resource_type,
                filename=EXCLUDED.filename,
                created_at=EXCLUDED.created_at;
        """, data)


def main():
    conn = get_conn(DB_DSN)
    ensure_state_table(conn)
    st = load_state_db(conn)  # {'etl_version', 'last_mtime', 'last_path'}
    last_m, last_p = st["last_mtime"], st["last_path"]

    # find only NEW/CHANGED files
    df_new = get_new_assets(servers, last_m, last_p)

    if df_new.empty:
        print("Crawler: nothing to do.")
        conn.close()
        return

    print(f"Crawler: {len(df_new)} new/changed file(s).")

    # rename columns to DB schema
    df_db = df_new.rename(columns={
        "Job ID": "job_id",
        "Job name": "job_name",
        "Type": "resource_type",
        "Path": "abs_path",
    })

    # insert in batches and advance watermark after each batch
    records = df_db.to_dict(orient="records")
    for i in range(0, len(records), BATCH_SIZE):
        chunk = records[i:i+BATCH_SIZE]
        insert_rows(conn, chunk)

        # watermark = last row of this chunk (because df_new is sorted by (mtime, path))
        last_row = chunk[-1]
        mtime_ts = int(last_row["created_at"].timestamp())
        last_path = last_row["abs_path"]
        save_state_db(conn, mtime_ts, last_path)

    conn.close()
    print("Crawler: done.")

if __name__ == "__main__":
    main()