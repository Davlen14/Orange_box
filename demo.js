const uploadTrigger = document.getElementById('upload-trigger');
const pdfUpload = document.getElementById('pdf-upload');
const geojsonCanvas = document.getElementById('geojson');
const container = document.querySelector('.pdf-container');  // Ensure you have this reference for panning
const pdfjsLib = window['pdfjs-dist/build/pdf'];

let isPanning = false;
let mouseX, mouseY;

// Worker required by PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

uploadTrigger.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent the default action of the anchor element
    pdfUpload.click();
});

pdfUpload.addEventListener('change', function() {
    const file = pdfUpload.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(event) {
            let pdfData = new Uint8Array(event.target.result);
            loadPDF(pdfData);
        };
        reader.readAsArrayBuffer(file);
    }
});

function loadPDF(data) {
    currentPDFData = data;
    console.log("Loading PDF...");  // Log for debugging
    pdfjsLib.getDocument({data: data}).promise.then(function(pdf) {
        console.log("PDF Loaded, rendering...");  // Log for debugging
        // Rendering the first page of the PDF.
        pdf.getPage(1).then(function(page) {
            const viewport = page.getViewport({scale: scale});
            const context = geojsonCanvas.getContext('2d');

            geojsonCanvas.height = viewport.height;
            geojsonCanvas.width = viewport.width;
            console.log("Canvas Size Set:", geojsonCanvas.width, "x", geojsonCanvas.height);  // Debugging log
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            page.render(renderContext).promise.then(() => {
                console.log("Page rendered!");  // Log for debugging
            }).catch((renderError) => {
                console.error("Error rendering page:", renderError);  // Log for debugging
            });
        }).catch((pageError) => {
            console.error("Error getting page:", pageError);  // Log for debugging
        });
    }).catch((pdfError) => {
        console.error("Error loading PDF:", pdfError);  // Log for debugging
    });
}

// Auto-pan functionality
container.addEventListener('mousemove', (e) => {
    if (isPanning) {
        const deltaX = mouseX - e.clientX;
        const deltaY = mouseY - e.clientY;

        const newLeft = parseInt(geojsonCanvas.style.left || 0) - deltaX;
        const newTop = parseInt(geojsonCanvas.style.top || 0) - deltaY;

        geojsonCanvas.style.left = newLeft + 'px';
        geojsonCanvas.style.top = newTop + 'px';

        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

container.addEventListener('mousedown', (e) => {
    isPanning = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

container.addEventListener('mouseup', () => {
    isPanning = false;
});

container.addEventListener('mouseleave', () => {
    isPanning = false;
});
let scale = 1.5;  // Initial scale

container.addEventListener('wheel', function(e) {
    e.preventDefault();  // Prevents the default zooming action

    // Determine zoom direction: Zoom in if delta is negative, out if positive
    if (e.deltaY < 0) {
        scale *= 1.1;  // Increase scale by 10%
    } else {
        scale /= 1.1;  // Decrease scale by 10%
    }

    // Re-render PDF with new scale
    loadPDF(currentPDFData);  // Assumes `currentPDFData` holds the current PDF data
}, { passive: false });

// why is my pdf not showing up in the canvas?
// https://stackoverflow.com/questions/44422884/why-is-my-pdf-not-showing-up-in-the-canvas
