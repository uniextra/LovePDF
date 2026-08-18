import json
import logging
import os
import shutil
import tempfile

from fastapi import BackgroundTasks, FastAPI, File, Form, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.pdf_utils import images_to_pdf, merge_pdfs, split_pdf

app = FastAPI(title="Local PDF Tool")

os.makedirs("app/static", exist_ok=True)
os.makedirs("app/static/css", exist_ok=True)
os.makedirs("app/static/js", exist_ok=True)


def cleanup_files(*file_paths: str) -> None:
    """Background task to remove files after they are served."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logging.error(f"Error deleting file {path}: {e}")


@app.post("/api/merge")
async def api_merge_pdfs(
    background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)  # noqa: B008
) -> FileResponse | JSONResponse:
    temp_files = []
    try:
        for file in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                shutil.copyfileobj(file.file, temp_file)
                temp_files.append(temp_file.name)

        output_stream = merge_pdfs(temp_files)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as out_temp:
            out_temp.write(output_stream.getvalue())
            out_temp_name = out_temp.name
        temp_files.append(out_temp_name)

        background_tasks.add_task(cleanup_files, *temp_files)

        return FileResponse(
            out_temp_name, filename="merged.pdf", media_type="application/pdf"
        )
    except Exception as e:
        logging.error(f"Merge error: {e}", exc_info=True)
        background_tasks.add_task(cleanup_files, *temp_files)
        return JSONResponse(status_code=400, content={"error": str(e)})


@app.post("/api/split")
async def api_split_pdf(
    background_tasks: BackgroundTasks, file: UploadFile = File(...)  # noqa: B008
) -> FileResponse | JSONResponse:
    temp_file_name = ""
    out_temp_name = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_name = temp_file.name

        output_stream = split_pdf(temp_file_name)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as out_temp:
            out_temp.write(output_stream.getvalue())
            out_temp_name = out_temp.name

        background_tasks.add_task(cleanup_files, temp_file_name, out_temp_name)

        return FileResponse(
            out_temp_name, filename="split_pages.zip", media_type="application/zip"
        )
    except Exception as e:
        logging.error(f"Split error: {e}", exc_info=True)
        if temp_file_name:
            background_tasks.add_task(cleanup_files, temp_file_name)
        return JSONResponse(status_code=400, content={"error": str(e)})


@app.post("/api/img2pdf")
async def api_img2pdf(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),  # noqa: B008
    rotations: str = Form(None),
) -> FileResponse | JSONResponse:
    temp_files = []
    try:
        rot_list = []
        if rotations:
            try:
                rot_list = json.loads(rotations)
            except json.JSONDecodeError:
                pass

        for file in files:
            ext = os.path.splitext(file.filename)[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                shutil.copyfileobj(file.file, temp_file)
                temp_files.append(temp_file.name)

        output_stream = images_to_pdf(temp_files, rot_list)
        if not output_stream:
            raise ValueError("No images processed")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as out_temp:
            out_temp.write(output_stream.getvalue())
            out_temp_name = out_temp.name
        temp_files.append(out_temp_name)

        background_tasks.add_task(cleanup_files, *temp_files)

        return FileResponse(
            out_temp_name, filename="images.pdf", media_type="application/pdf"
        )
    except Exception as e:
        logging.error(f"Image conversion error: {e}", exc_info=True)
        background_tasks.add_task(cleanup_files, *temp_files)
        return JSONResponse(status_code=400, content={"error": str(e)})


# Serve static files for frontend
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")
