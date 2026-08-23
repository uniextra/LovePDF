let currentTool = '';
let selectedFiles = [];
let selectedRotations = [];
let draggedIndex = -1;

const modalInfos = {
    'merge': {
        title: 'Merge PDF',
        desc: 'Select multiple PDF files to combine into a single document. Drag or use arrows to reorder.',
        accept: '.pdf',
        multiple: true,
        buttonText: 'Merge PDFs',
        formats: 'Supports .PDF'
    },
    'split': {
        title: 'Split PDF',
        desc: 'Select a PDF to extract each page into separate PDF files (downloaded in a ZIP).',
        accept: '.pdf',
        multiple: false,
        buttonText: 'Split PDF',
        formats: 'Supports .PDF'
    },
    'img2pdf': {
        title: 'Images to PDF',
        desc: 'Select images to convert into a single PDF. Click ⟳ to rotate each image, drag or use arrows to reorder.',
        accept: 'image/*',
        multiple: true,
        buttonText: 'Convert to PDF',
        formats: 'Supports .JPG, .PNG, .HEIC, .WEBP'
    }
};

const modal = document.getElementById('upload-modal');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const processBtn = document.getElementById('process-btn');
const loading = document.getElementById('loading');
const fileCountLabel = document.getElementById('file-count-label');
const formatHints = document.getElementById('format-hints');

function openModal(tool) {
    currentTool = tool;
    selectedFiles = [];
    selectedRotations = [];
    
    document.getElementById('modal-title').textContent = modalInfos[tool].title;
    document.getElementById('modal-desc').textContent = modalInfos[tool].desc;
    if (formatHints) formatHints.textContent = modalInfos[tool].formats;
    
    fileInput.accept = modalInfos[tool].accept;
    if (modalInfos[tool].multiple) {
        fileInput.setAttribute('multiple', '');
    } else {
        fileInput.removeAttribute('multiple');
    }
    
    updateFileList();
    
    modal.classList.add('active');
    processBtn.disabled = true;
    loading.classList.add('hidden');
}

function closeModal() {
    modal.classList.remove('active');
}

// Close on backdrop click
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Drag & Drop Handlers for upload zone
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

function handleFiles(files) {
    const multiple = modalInfos[currentTool].multiple;
    const newFiles = Array.from(files);
    
    if (!multiple) {
        selectedFiles = [newFiles[0]];
        selectedRotations = [0];
    } else {
        selectedFiles = [...selectedFiles, ...newFiles];
        selectedRotations = [...selectedRotations, ...new Array(newFiles.length).fill(0)];
    }
    
    updateFileList();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    selectedRotations.splice(index, 1);
    updateFileList();
}

function rotateImage(index) {
    selectedRotations[index] = (selectedRotations[index] + 90) % 360;
    const imgElement = document.getElementById(`preview-img-${index}`);
    if (imgElement) {
        imgElement.style.transform = `rotate(${selectedRotations[index]}deg)`;
    }
}

// Drag & Drop Handlers for reordering items
function dragStart(e, index) {
    e.stopPropagation();
    draggedIndex = index;
    const item = e.target.closest('.draggable-item');
    if (item) {
        setTimeout(() => item.classList.add('dragging'), 0);
    }
}

function dragOver(e) {
    e.preventDefault(); 
    e.stopPropagation();
}

function drop(e, dropIndex) {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;
    
    const draggedFile = selectedFiles[draggedIndex];
    const draggedRotation = selectedRotations[draggedIndex];
    
    // Remove from original position
    selectedFiles.splice(draggedIndex, 1);
    selectedRotations.splice(draggedIndex, 1);
    
    // Insert into new position directly
    selectedFiles.splice(dropIndex, 0, draggedFile);
    selectedRotations.splice(dropIndex, 0, draggedRotation);
    
    draggedIndex = -1;
    updateFileList();
}

function dragEnd(e) {
    e.stopPropagation();
    const item = e.target.closest('.draggable-item');
    if (item) {
        item.classList.remove('dragging');
    }
}

function moveItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedFiles.length) return;
    
    const tempFile = selectedFiles[index];
    const tempRot = selectedRotations[index];
    
    selectedFiles[index] = selectedFiles[newIndex];
    selectedRotations[index] = selectedRotations[newIndex];
    
    selectedFiles[newIndex] = tempFile;
    selectedRotations[newIndex] = tempRot;
    
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = '';
    
    const count = selectedFiles.length;
    if (fileCountLabel) {
        if (count === 0) {
            fileCountLabel.textContent = 'No files selected';
        } else if (count === 1) {
            fileCountLabel.textContent = '1 file selected';
        } else {
            fileCountLabel.textContent = `${count} files selected`;
        }
    }
    
    if (count > 0) {
        processBtn.disabled = false;
        
        if (currentTool === 'img2pdf') {
            const grid = document.createElement('div');
            grid.className = 'thumbnail-grid';
            selectedFiles.forEach((file, index) => {
                const el = document.createElement('div');
                el.className = 'thumbnail-item draggable-item';
                el.draggable = true;
                el.ondragstart = (e) => dragStart(e, index);
                el.ondragover = dragOver;
                el.ondrop = (e) => drop(e, index);
                el.ondragend = dragEnd;
                
                const url = URL.createObjectURL(file);
                
                el.innerHTML = `
                    <div class="thumb-wrapper" style="pointer-events: none;">
                        <img id="preview-img-${index}" src="${url}" style="transform: rotate(${selectedRotations[index]}deg)" alt="preview">
                    </div>
                    <button class="rotate-btn" onclick="rotateImage(${index})" title="Rotate 90°">⟳</button>
                    <div class="thumb-info">
                        <span class="move-btn" onclick="moveItem(${index}, -1)" title="Move left">◀</span>
                        <span class="thumb-name" title="${file.name}">${file.name}</span>
                        <span class="move-btn" onclick="moveItem(${index}, 1)" title="Move right">▶</span>
                        <span class="thumb-remove" onclick="removeFile(${index})" title="Remove">✕</span>
                    </div>
                `;
                grid.appendChild(el);
            });
            fileList.appendChild(grid);
        } else {
            selectedFiles.forEach((file, index) => {
                const el = document.createElement('div');
                el.className = 'file-item draggable-item';
                el.draggable = true;
                el.ondragstart = (e) => dragStart(e, index);
                el.ondragover = dragOver;
                el.ondrop = (e) => drop(e, index);
                el.ondragend = dragEnd;
                
                el.innerHTML = `
                    <div class="flex items-center gap-2" style="pointer-events: none;">
                        <span class="material-symbols-outlined text-slate-400 text-[18px]">drag_indicator</span>
                        <span class="material-symbols-outlined text-red-500 text-[20px]">picture_as_pdf</span>
                        <span class="truncate max-w-[280px] sm:max-w-md">${file.name}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="move-btn text-xs px-1.5 py-0.5" onclick="moveItem(${index}, -1)" title="Move up">▲</span>
                        <span class="move-btn text-xs px-1.5 py-0.5" onclick="moveItem(${index}, 1)" title="Move down">▼</span>
                        <span class="thumb-remove text-sm px-1.5 py-0.5 ml-1" onclick="removeFile(${index})" title="Remove">✕</span>
                    </div>
                `;
                fileList.appendChild(el);
            });
        }
    } else {
        processBtn.disabled = true;
    }
}

processBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0 || processBtn.disabled) return;
    
    loading.classList.remove('hidden');
    
    const formData = new FormData();
    if (modalInfos[currentTool].multiple) {
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
    } else {
        formData.append('file', selectedFiles[0]);
    }
    
    if (currentTool === 'img2pdf') {
        formData.append('rotations', JSON.stringify(selectedRotations));
    }
    
    let endpoint = `/api/${currentTool}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const err = await response.json();
                throw new Error(err.error || "Unknown error occurred");
            }
            throw new Error('Processing failed on server');
        }
        
        const blob = await response.blob();
        
        let filename = `processed_${Date.now()}`;
        const disposition = response.headers.get('content-disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
        } else {
            if (currentTool === 'merge' || currentTool === 'img2pdf') filename += '.pdf';
            if (currentTool === 'split') filename += '.zip';
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        closeModal();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});
