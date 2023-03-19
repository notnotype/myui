import hashlib
import os
import glob
from pathlib import Path
from operator import itemgetter

from fastapi import FastAPI, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

upload_dir = Path("./uploads")
upload_dir.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/upload_start")
# async def upload_start(filename: str, size: int, hash: str):
    

@app.post("/upload_chunk")
async def upload_chunk(file: UploadFile, chunk: int, chunk_hash: str, uuid: str):
    sha1 = hashlib.sha1()
    data = await file.read()
    sha1.update(data)
    chunk_hash_local = sha1.hexdigest()
    if chunk_hash_local != chunk_hash:
        return {"code": 1, "msg": f"difference chunk_hash: [{chunk_hash}] - [{chunk_hash_local}]"}
    file_path = f"{uuid}-{sha1.hexdigest()}-{chunk}"
    with open(upload_dir / file_path, "wb") as f:
        f.write(data)
    
    return {"code": 0, "msg": "ok"}

@app.get("/upload_progress")
async def upload_progress(uuid: str):
    files = []  # [[file_hash, index],,]
    for fname in glob.glob(f"{upload_dir.name}/{uuid}-*"):
        files.append(fname.split("-")[1:])
    return {"code": 0, "msg": "ok", "data": files}

@app.put("/upload_end")
async def upload_end(uuid: str, filename: str):
    files = []  # [[uuid, file_hash, index],,]
    for fname in glob.glob(f"{upload_dir.name}/{uuid}-*"):
        files.append(fname.split("-"))
    files.sort(key=lambda x: int(x[-1]))
    print(files)
    with open(upload_dir / filename, "wb") as f:
        for file in files:
            with open("-".join(file), "rb") as f2:
                f.write(f2.read())
            os.remove("-".join(file))
    return {"code": 0, "msg": "ok"}