from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, Query
import os, mimetypes
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))
load_dotenv(dotenv_path=Path(__file__).with_name(".env.development"), override=False)


dsn = os.getenv("DATABASE_URL")
if not dsn:
    raise RuntimeError("Set dsn in api/.env.development or your host env")

# dsn = "postgresql://postgres:MattB01@localhost:5432/xanita-app" # Connecting to postgres db
app = FastAPI(title="Xanita Search")

ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS")

# Optional: allow all Vercel preview URLs (regex), e.g. set env to: https://.*\.vercel\.app
ALLOW_ORIGIN_REGEX = os.getenv("ALLOW_ORIGIN_REGEX")

if ALLOW_ORIGINS:
    origins = [o.strip() for o in ALLOW_ORIGINS.split(",") if o.strip()]
else:
    # sensible dev defaults
    origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8080", "http://127.0.0.1:8080",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=ALLOW_ORIGIN_REGEX,   # can be None
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # handy later for downloads
)

def run_query(sql, params):
    with psycopg2.connect(dsn) as con, con.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, params)
        return cur.fetchall()

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/search")
def search(id: int = None, job_id: str = None,name: str = None, year: int = None, types: List[str] = Query(default=[]), limit: int =100):
    sql = """
        SELECT id, job_name, job_id, resource_type, abs_path 
        FROM public.resources
        WHERE 1=1
    """
    params = []
    if id:
        sql += """ AND id = %s"""
        params.append(id)

    if job_id:
        sql += """ AND job_id = %s"""
        params.append(job_id)

    if name:
        sql += """ AND job_name ILIKE %s"""
        params.append(f"%{name}%")

    if year:
        sql += """ AND EXTRACT(YEAR FROM created_at) = %s"""
        params.append(year)

    if types:
        if isinstance(types, str):
            types = [t.strip() for t in types.split(",") if t.strip()]
        sql += """ AND resource_type = ANY(%s)"""
        params.append(types)

    sql +=  " ORDER BY job_name, resource_type, filename LIMIT %s"
    params.append(limit)

    rows = run_query(sql, params)
    return rows

@app.get("/material_usage")
def material_usage(job_id: str = None, name: str = None, xb_type: str = None, thickness: str = None, size: str = None, units_up: float = 0.0, 
                   width:int=0, height:int=0, depth:int=0, limit: int = 100):
    params = []
    sql = """
        SELECT DISTINCT resources.id, mu_jobs.job_id, resources.job_name, resources.resource_type,resources.abs_path, filename
        FROM resources, mu_jobs, mu_boards, mu_dimensions
        WHERE resource_type = 'mu_sheet'
        AND resources.job_id = mu_jobs.job_id
        AND mu_jobs.uid=mu_boards.uid
        AND mu_jobs.uid=mu_dimensions.uid
    """
    if job_id:
        sql += """ AND resources.job_id = %s"""
        params.append(job_id)
    if name:
        sql += """ AND resources.job_name ILIKE %s"""
        params.append(f"%{name}%")
    if xb_type:
        sql += """ AND xb_type ILIKE %s"""
        params.append(f"%{xb_type}%")
    if thickness:
        sql += """ AND thickness_mm = %s"""
        params.append(thickness)
    if size:
        sql += """ AND size_text ILIKE %s"""
        params.append(f"%{size}%")
    if units_up:
        sql+= """ AND units_up = %s"""
        params.append(units_up)
    if width:
        sql+= """ AND width_mm = %s"""
        params.append(width)
    if height:
        sql+= """ AND height_mm = %s"""
        params.append(height)
    if depth:
        sql+= """ AND depth_mm = %s"""
        params.append(depth)
    sql += """ ORDER BY job_id LIMIT %s;"""
    params.append(limit)

    rows = run_query(sql, params)
    return rows
        

# @app.get("/resources/{id}")
# def download_resource(id: int):
#     params = []
#     sql = """
#         SELECT abs_path, filename FROM resources WHERE id = %s     
#     """
#     # params = id
#     rows = run_query(sql,[id])
#     abs_path = rows[0]["abs_path"]
#     filename = rows[0]["filename"]
#     if not os.path.exists(abs_path):
#         # File was indexed but is no longer on disk
#         raise HTTPException(status_code=410, detail="File missing on disk")
#     mime = mimetypes.guess_type(filename)[0] or "application/octet-stream"
#     return FileResponse(abs_path, media_type=mime, filename=filename)

@app.get("/resources/{id}")
def get_resource_path(id: int):
    row = run_query("SELECT abs_path, filename FROM resources WHERE id = %s", [id])
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return {"filename": row[0]["filename"], "path": row[0]["abs_path"]}




