import os
import tempfile
import uuid
import json
from fastapi import FastAPI, File, UploadFile, BackgroundTasks, Form
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from app.pdf_utils import merge_pdfs, split_pdf, images_to_pdf
import shutil

app = FastAPI(title="Local PDF Tool")

os.makedirs("app/static", exist_ok=True)
os.makedirs("app/static/css", exist_ok=True)
os.makedirs("app/static/js", exist_ok=True)


def cleanup_files(*file_paths):
    """Background task to remove files after they are served."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error deleting file {path}: {e}")

@app.post("/api/merge")
async def api_merge_pdfs(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)):
    temp_files = []
    try:
        for file in files:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            shutil.copyfileobj(file.file, temp_file)
            temp_file.close()
            temp_files.append(temp_file.name)
            
        output_stream = merge_pdfs(temp_files)
        
        out_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        out_temp.write(output_stream.getvalue())
        out_temp.close()
        temp_files.append(out_temp.name)
        
        background_tasks.add_task(cleanup_files, *temp_files)
        
        return FileResponse(out_temp.name, filename="merged.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        background_tasks.add_task(cleanup_files, *temp_files)
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/split")
async def api_split_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        shutil.copyfileobj(file.file, temp_file)
        temp_file.close()
        
        output_stream = split_pdf(temp_file.name)
        
        out_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        out_temp.write(output_stream.getvalue())
        out_temp.close()
        
        background_tasks.add_task(cleanup_files, temp_file.name, out_temp.name)
        
        return FileResponse(out_temp.name, filename="split_pages.zip", media_type="application/zip")
    except Exception as e:
        import traceback
        traceback.print_exc()
        background_tasks.add_task(cleanup_files, temp_file.name)
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/img2pdf")
async def api_img2pdf(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...), rotations: str = Form(None)):
    temp_files = []
    try:
        rot_list = []
        if rotations:
            try:
                rot_list = json.loads(rotations)
            except:
                pass
                
        for file in files:
            ext = os.path.splitext(file.filename)[1]
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            shutil.copyfileobj(file.file, temp_file)
            temp_file.close()
            temp_files.append(temp_file.name)
            
        output_stream = images_to_pdf(temp_files, rot_list)
        
        out_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        out_temp.write(output_stream.getvalue())
        out_temp.close()
        temp_files.append(out_temp.name)
        
        background_tasks.add_task(cleanup_files, *temp_files)
        
        return FileResponse(out_temp.name, filename="images.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        background_tasks.add_task(cleanup_files, *temp_files)
        return JSONResponse(status_code=400, content={"error": str(e)})

# Serve static files for frontend
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")
