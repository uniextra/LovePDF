import os
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

def merge_pdfs(file_paths):
    writer = PdfWriter()
    for path in file_paths:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)
    
    output = BytesIO()
    writer.write(output)
    output.seek(0)
    return output

def split_pdf(file_path):
    import zipfile
    reader = PdfReader(file_path)
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            pdf_buffer = BytesIO()
            writer.write(pdf_buffer)
            zip_file.writestr(f"page_{i+1}.pdf", pdf_buffer.getvalue())
            
    zip_buffer.seek(0)
    return zip_buffer

def images_to_pdf(image_paths, rotations=None):
    images = []
    if not rotations:
        rotations = [0] * len(image_paths)
        
    for i, path in enumerate(image_paths):
        img = Image.open(path)
        img.load()  # Force load pixel data
        
        img = img.convert('RGB')
        img.info = {}
        
        angle = rotations[i] if i < len(rotations) else 0
        if angle != 0:
            # Negative because PIL rotate goes counter-clockwise by default, 
            # and CSS transform goes clockwise. So -angle fixes it.
            img = img.rotate(-angle, expand=True)
            
        images.append(img)
    
    if not images:
        return None
        
    output = BytesIO()
    if len(images) == 1:
        images[0].save(output, format="PDF", resolution=100.0)
    else:
        images[0].save(output, format="PDF", save_all=True, append_images=images[1:], resolution=100.0)
    output.seek(0)
    return output
