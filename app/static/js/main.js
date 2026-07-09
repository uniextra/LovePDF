let currentTool = '';
let selectedFiles = [];
let selectedRotations = [];
let draggedIndex = -1;

const modalInfos = {
    'merge': {
        title: 'Merge PDF',
        desc: 'Select PDFs to combine into a single file. Drag to reorder.',
        accept: '.pdf',
        multiple: true
    },
    'split': {
        title: 'Split PDF',
        desc: 'Select a PDF to extract pages (returns a ZIP).',
        accept: '.pdf',
        multiple: false
    },
    'img2pdf': {
        title: 'Images to PDF',
        desc: 'Select images to convert to PDF. Drag to reorder, use ⟳ to rotate.',
        accept: 'image/*',
        multiple: true
    }
};

const modal = document.getElementById('upload-modal');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const processBtn = document.getElementById('process-btn');
const loading = document.getElementById('loading');

function openModal(tool) {
    currentTool = tool;
    selectedFiles = [];
    selectedRotations = [];
    updateFileList();
    
    document.getElementById('modal-title').textContent = modalInfos[tool].title;
    document.getElementById('modal-desc').textContent = modalInfos[tool].desc;
    fileInput.accept = modalInfos[tool].accept;
    if (modalInfos[tool].multiple) {
        fileInput.setAttribute('multiple', '');
    } else {
        fileInput.removeAttribute('multiple');
    }
    
    modal.classList.add('active');
    modal.classList.remove('hidden');
    processBtn.classList.remove('hidden');
    loading.classList.add('hidden');
}

function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

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
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
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
    if(item) {
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
    if(item) {
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
    
    if (selectedFiles.length > 0) {
        processBtn.classList.remove('disabled');
        
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
                    <button class="rotate-btn" onclick="rotateImage(${index})">⟳</button>
                    <div class="thumb-info">
                        <span class="move-btn" onclick="moveItem(${index}, -1)">◀</span>
                        <span class="thumb-name" title="${file.name}">${file.name}</span>
                        <span class="move-btn" onclick="moveItem(${index}, 1)">▶</span>
                        <span class="thumb-remove" onclick="removeFile(${index})">✕</span>
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
                    <span style="pointer-events: none;">☰ 📄 ${file.name}</span>
                    <span style="cursor:pointer; color:red;" onclick="removeFile(${index})">✕</span>
                `;
                fileList.appendChild(el);
            });
        }
    } else {
        processBtn.classList.add('disabled');
    }
}

processBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0 || processBtn.classList.contains('disabled')) return;
    
    processBtn.classList.add('hidden');
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
                throw new Error(err.error || "Unknown error");
            }
            throw new Error('Processing failed');
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
        processBtn.classList.remove('hidden');
        loading.classList.add('hidden');
    }
});
