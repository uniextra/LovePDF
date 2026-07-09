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

## Despliegue con Docker Compose (Local)

1. Clona este repositorio o descarga los archivos.
2. Abre una terminal en la raíz del proyecto.
3. Ejecuta el comando:
   ```bash
   docker-compose up -d --build
   ```
4. Accede a la aplicación desde tu navegador en `http://localhost:8000/`.

## Despliegue en Portainer (Producción)

Si vas a desplegar esta aplicación como un stack en Portainer, el código fuente ya está "horneado" (`COPY ./app ./app`) dentro del `Dockerfile`. 

1. Ve a **Stacks** en Portainer y haz clic en **Add stack**.
2. Sube el código fuente o enlaza el repositorio.
3. Utiliza el `docker-compose.yml` provisto (que no incluye mapeo de volumen local a `/app/app` para evitar sobreescritura).
4. Despliega el stack.

## Privacidad

> [!IMPORTANT]
> Se utiliza el módulo `tempfile` de Python y tareas en segundo plano (`BackgroundTasks` de FastAPI) para la gestión efímera de los archivos. Ningún documento subido ni generado permanecerá en el sistema de archivos del servidor después de la solicitud.
