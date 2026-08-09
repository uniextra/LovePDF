# Local PDF Tool (iLovePDF Clone)

Una aplicación web completa y privada para la manipulación de archivos PDF y la conversión de imágenes, diseñada para ejecutarse en entornos locales (como Docker o Portainer). 

Esta herramienta destaca por su enfoque en la privacidad: todo el procesamiento se realiza temporalmente en la memoria del contenedor, y los archivos se destruyen de forma inmediata e irrecuperable una vez que el usuario los descarga.

## Características

*   **Interfaz Moderna y Responsiva:** Diseño estilizado basado en _glassmorphism_.
*   **Unir PDF (Merge PDF):** Combina múltiples documentos PDF en uno solo. Soporta reordenamiento arrastrando y soltando (_drag & drop_).
*   **Dividir PDF (Split PDF):** Extrae todas las páginas de un PDF y te las devuelve en un archivo ZIP.
*   **Imágenes a PDF (Images to PDF):** Convierte archivos de imagen a PDF.
    *   Soporte nativo para formatos estándar (JPG, PNG) y **HEIC** (iPhone/Apple).
    *   Genera miniaturas (thumbnails) de previsualización de cada imagen.
    *   Permite **rotar** las imágenes individualmente (90°, 180°, etc.).
    *   Permite reordenar las imágenes arrastrándolas o utilizando botones direccionales (◀ y ▶).

## Tecnologías Utilizadas

*   **Backend:** Python 3.11, FastAPI
*   **Procesamiento:** PyPDF2 (Manipulación PDF), Pillow (Imágenes), pillow-heif (Soporte HEIC)
*   **Frontend:** HTML5, Vanilla CSS, Vanilla JavaScript
*   **Despliegue:** Docker, Docker Compose

## Despliegue usando Docker Hub (Recomendado)

La imagen ya se encuentra pre-construida y lista para usarse desde Docker Hub. Es la forma más rápida y sencilla de desplegarla.

### Vía CLI (Terminal)
Ejecuta directamente el contenedor apuntando a la imagen oficial:
```bash
docker run -d -p 8000:8000 --name lovepdf-clone uniextra/lovepdf:latest
```

### Vía Portainer / Docker Compose
Si prefieres usar un `docker-compose.yml`, crea un archivo con este contenido (nota que utilizamos `image` en lugar de `build`):
```yaml
services:
  pdf-tool:
    image: uniextra/lovepdf:latest
    container_name: local-pdf-tool
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
```

## Despliegue construyendo desde el código fuente

Si prefieres construir la imagen tú mismo a partir de este repositorio:

1. Clona este repositorio o descarga los archivos.
2. Ejecuta el comando:
   ```bash
   docker-compose up -d --build
   ```
3. Accede a la aplicación desde tu navegador en `http://localhost:8000/`.

## Privacidad

> [!IMPORTANT]
> Se utiliza el módulo `tempfile` de Python y tareas en segundo plano (`BackgroundTasks` de FastAPI) para la gestión efímera de los archivos. Ningún documento subido ni generado permanecerá en el sistema de archivos del servidor después de la solicitud.
