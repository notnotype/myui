import hashlib
from pathlib import Path

from fastapi import FastAPI, UploadFile
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

@app.post("/upload")
async def upload(file: UploadFile, chunk: int):
    md5 = hashlib.md5()
    data = await file.read()
    md5.update(data)
    file_path = f"{md5.hexdigest()}-{chunk}"
    with open(upload_dir / file_path, "wb") as f:
        f.write(data)
    
    return {"code": 0, "msg": "ok"}
