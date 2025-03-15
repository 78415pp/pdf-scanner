// DOM Elements
const cameraPreview = document.getElementById('camera-preview');
const captureCanvas = document.getElementById('capture-canvas');
const captureBtn = document.getElementById('capture-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const flashToggle = document.getElementById('flash-toggle');
const modeToggle = document.getElementById('mode-toggle');
const cameraSwitchBtn = document.getElementById('camera-switch');
const galleryBtn = document.getElementById('gallery-btn');
const noPreview = document.querySelector('.no-preview');
const capturedImageContainer = document.querySelector('.captured-image-container');
const capturedImage = document.getElementById('captured-image');
const pdfPreviewModal = document.getElementById('pdf-preview-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const pdfIframe = document.getElementById('pdf-iframe');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const scanOverlay = document.getElementById('scan-overlay');

// DOM Elements - Top Feature Buttons
const flashBtn = document.getElementById('flash-btn');
const hdBtn = document.getElementById('hd-btn');
const filterBtn = document.getElementById('filter-btn');
const gridBtn = document.getElementById('grid-btn');
const settingsBtn = document.getElementById('settings-btn');

// DOM Elements - Bottom Mode Buttons
const bookModeBtn = document.getElementById('book-mode');
const textModeBtn = document.getElementById('text-mode');
const docsModeBtn = document.getElementById('docs-mode');
const idCardModeBtn = document.getElementById('idcard-mode');
const qrCodeModeBtn = document.getElementById('qrcode-mode');
const importModeBtn = document.getElementById('import-mode');

// DOM Elements - Grid and Modals
const gridOverlay = document.getElementById('grid-overlay');
const filterModal = document.getElementById('filter-modal');
const closeFilterModalBtn = document.getElementById('close-filter-modal-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');
const filterOptions = document.querySelectorAll('.filter-option');

// DOM Elements - Settings
const qualitySetting = document.getElementById('quality-setting');
const formatSetting = document.getElementById('format-setting');
const autoEnhanceToggle = document.getElementById('auto-enhance-toggle');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Global variables
let stream = null;
let hasFlash = false;
let flashOn = false;
let isDarkMode = true;
let capturedImages = [];
let currentPdfBlob = null;
let isScanning = false;

// New global variables
let hdMode = false;
let gridVisible = false;
let currentMode = 'docs'; // Default mode
let currentFilter = 'normal';
let scanQuality = 'medium'; // 'low', 'medium', 'high'
let pdfFormat = 'a4'; // 'a4', 'letter', 'auto'
let autoEnhance = true;

// Global variable to store available cameras
let availableCameras = [];
let currentCameraIndex = 0;

// Initialize the app
function initApp() {
    // Event listeners
    captureBtn.addEventListener('click', handleCaptureClick);
    cancelBtn.addEventListener('click', cancelCapture);
    saveBtn.addEventListener('click', saveCapture);
    flashToggle.addEventListener('click', toggleFlash);
    modeToggle.addEventListener('click', toggleMode);
    cameraSwitchBtn.addEventListener('click', switchCamera);
    galleryBtn.addEventListener('click', openGallery);
    closeModalBtn.addEventListener('click', closeModal);
    downloadPdfBtn.addEventListener('click', downloadPdf);

    // Event listeners for top feature buttons
    flashBtn.addEventListener('click', handleFlashBtn);
    hdBtn.addEventListener('click', toggleHDMode);
    filterBtn.addEventListener('click', openFilterModal);
    gridBtn.addEventListener('click', toggleGrid);
    settingsBtn.addEventListener('click', openSettingsModal);

    // Event listeners for bottom mode buttons
    bookModeBtn.addEventListener('click', () => switchMode('book'));
    textModeBtn.addEventListener('click', () => switchMode('text'));
    docsModeBtn.addEventListener('click', () => switchMode('docs'));
    idCardModeBtn.addEventListener('click', () => switchMode('idcard'));
    qrCodeModeBtn.addEventListener('click', () => switchMode('qrcode'));
    importModeBtn.addEventListener('click', () => switchMode('import'));

    // Event listeners for modal close buttons
    closeFilterModalBtn.addEventListener('click', closeFilterModal);
    closeSettingsModalBtn.addEventListener('click', closeSettingsModal);

    // Event listeners for filter options
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            const filter = option.getAttribute('data-filter');
            applyFilter(filter);
            closeFilterModal();
        });
    });

    // Event listeners for settings
    qualitySetting.addEventListener('change', updateQualitySetting);
    formatSetting.addEventListener('change', updateFormatSetting);
    autoEnhanceToggle.addEventListener('change', updateAutoEnhance);
    darkModeToggle.addEventListener('change', updateDarkModeSetting);

    // Set initial active mode
    docsModeBtn.classList.add('active');

    // Add visual feedback for button press
    addButtonFeedback();

    // File input for gallery
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', handleFileSelect);
    
    galleryBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Additional file input for import button
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = 'image/*';
    importInput.multiple = true;
    importInput.style.display = 'none';
    document.body.appendChild(importInput);
    
    importInput.addEventListener('change', handleFileSelect);
    
    importModeBtn.addEventListener('click', () => {
        importInput.click();
    });

    // Add camera device list refresh
    navigator.mediaDevices.addEventListener('devicechange', () => {
        if (stream) {
            console.log('कैमरा डिवाइस परिवर्तन का पता चला, डिवाइस सूची अपडेट हो रही है...');
            updateCameraDeviceList();
        }
    });
    
    // Initially check for available cameras
    updateCameraDeviceList().then(() => {
        console.log('प्रारंभिक कैमरा डिवाइस चेक पूरा हुआ');
    }).catch(error => {
        console.error('प्रारंभिक कैमरा डिवाइस चेक में त्रुटि:', error);
    });
}

// Add visual feedback for button press
function addButtonFeedback() {
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = '';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });
}

// Handle capture button click
async function handleCaptureClick() {
    // If camera is not active, start it
    if (!stream) {
        await startCamera();
        return;
    }
    
    // Show scanning effect
    showScanningEffect();
    
    // If camera is active, take a picture
    setTimeout(() => {
        takePicture();
    }, 500);
}

// Show scanning effect
function showScanningEffect() {
    if (isScanning) return;
    
    isScanning = true;
    scanOverlay.style.display = 'block';
    
    // Hide scanning effect after animation
    setTimeout(() => {
        scanOverlay.style.display = 'none';
        isScanning = false;
    }, 1000);
}

// Start the camera
async function startCamera() {
    try {
        // First get list of available video devices (cameras)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Update global camera list
        availableCameras = videoDevices;
        currentCameraIndex = 0;
        
        // Update camera switch button visibility
        cameraSwitchBtn.style.display = availableCameras.length > 1 ? 'flex' : 'none';
        
        // Log available cameras for debugging
        console.log('उपलब्ध कैमरा डिवाइस:', videoDevices);
        
        // Default constraints with no specific camera selected
        const constraints = {
            video: {
                // Remove facingMode to not restrict to the rear camera
                // facingMode: 'environment',
                width: hdMode ? { ideal: 3840 } : { ideal: 1920 },
                height: hdMode ? { ideal: 2160 } : { ideal: 1080 }
            }
        };
        
        // If external cameras are available (more than 1 camera), try to use one
        if (videoDevices.length > 1) {
            try {
                showNotification('External कैमरा कनेक्ट करने का प्रयास...');
                
                // Try to use the last device in the list (often an external camera)
                // You can change this logic if needed
                const externalCamera = videoDevices[videoDevices.length - 1];
                
                constraints.video.deviceId = { exact: externalCamera.deviceId };
                console.log('External कैमरा का उपयोग करने का प्रयास:', externalCamera.label);
                
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                console.error('External कैमरा उपयोग में विफल:', error);
                
                // If external camera fails, fall back to default camera
                delete constraints.video.deviceId;
                constraints.video.facingMode = 'environment'; // Default back to environment facing
                
                showNotification('डिफॉल्ट कैमरा का उपयोग करना', 'info');
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
        } else {
            // Only one camera available, use default camera
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        cameraPreview.srcObject = stream;
        
        // Show camera preview and hide no-preview message
        cameraPreview.style.display = 'block';
        noPreview.style.display = 'none';
        
        // Add subtle animation to capture button to draw attention
        captureBtn.classList.add('pulse-animation');
        
        // Check if flash is available
        checkFlashAvailability();
        
        // Apply current filter
        applyFilter(currentFilter);
        
        // Show grid if enabled
        if (gridVisible) {
            gridOverlay.style.display = 'block';
        }
        
        // Update HD indicator
        updateHDIndicator();
        
        // Show camera info
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            console.log('कैमरा सेटिंग्स:', videoTrack.getSettings());
            console.log('कैमरा कैपेबिलिटीज:', videoTrack.getCapabilities());
            
            const label = videoTrack.label || 'डिफॉल्ट कैमरा';
            showNotification(`कैमरा कनेक्टेड: ${label}`, 'success');
        }
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showNotification('कैमरा एक्सेस करने में समस्या हुई। कृपया अनुमति दें और पुन: प्रयास करें।', 'error');
    }
}

// Check if flash is available
function checkFlashAvailability() {
    if (stream && stream.getVideoTracks().length > 0) {
        const track = stream.getVideoTracks()[0];
        
        // Check if torch (flash) is supported
        if ('ImageCapture' in window) {
            const imageCapture = new ImageCapture(track);
            imageCapture.getPhotoCapabilities()
                .then(capabilities => {
                    hasFlash = !!capabilities.torch;
                    flashToggle.style.display = hasFlash ? 'flex' : 'none';
                    flashBtn.style.opacity = hasFlash ? '1' : '0.5';
                })
                .catch(error => {
                    console.error('Error checking flash capabilities:', error);
                    flashToggle.style.display = 'none';
                    flashBtn.style.opacity = '0.5';
                });
        } else {
            flashToggle.style.display = 'none';
            flashBtn.style.opacity = '0.5';
        }
    }
}

// Toggle flash
function toggleFlash() {
    if (!hasFlash || !stream) return;
    
    const track = stream.getVideoTracks()[0];
    
    // Toggle flash state
    flashOn = !flashOn;
    
    if (track.getCapabilities && track.getCapabilities().torch) {
        track.applyConstraints({
            advanced: [{ torch: flashOn }]
        });
        
        // Update the flash icon
        flashToggle.innerHTML = flashOn 
            ? '<i class="fas fa-bolt" style="color: yellow;"></i>' 
            : '<i class="fas fa-bolt"></i>';
        
        // Update the top feature button too
        flashBtn.innerHTML = flashOn 
            ? '<i class="fas fa-bolt" style="color: yellow;"></i><span>Flash</span>' 
            : '<i class="fas fa-bolt"></i><span>Flash</span>';
        
        flashBtn.classList.toggle('active', flashOn);
    }
}

// Toggle scanning mode (light/dark)
function toggleMode() {
    isDarkMode = !isDarkMode;
    darkModeToggle.checked = isDarkMode;
    
    // Update the icon
    modeToggle.innerHTML = isDarkMode 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
    
    // Apply filter to camera preview
    if (isDarkMode) {
        cameraPreview.style.filter = 'none';
    } else {
        cameraPreview.style.filter = 'brightness(1.2) contrast(1.2)';
    }
}

// Open gallery to select images
function openGallery() {
    // Gallery functionality is handled by file input click event
}

// Handle file selection from gallery
function handleFileSelect(event) {
    const files = event.target.files;
    
    if (files && files.length > 0) {
        // Clear previous captures
        capturedImages = [];
        
        // Process each selected file
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    capturedImages.push(e.target.result);
                    
                    // If this is the first image, display it
                    if (capturedImages.length === 1) {
                        showCapturedImage(capturedImages[0]);
                    }
                    
                    // If we have at least one image, generate PDF
                    if (capturedImages.length > 0) {
                        generatePDF();
                    }
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        showNotification(`${files.length} फाइल चुनी गई`);
    }
}

// Take a picture using the camera
function takePicture() {
    if (!stream) return;
    
    // Add capture sound effect
    playCaptureSoundEffect();
    
    // Set canvas dimensions to match video dimensions
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    
    captureCanvas.width = settings.width || cameraPreview.videoWidth;
    captureCanvas.height = settings.height || cameraPreview.videoHeight;
    
    // Draw the current frame from video to canvas
    const context = captureCanvas.getContext('2d');
    context.drawImage(cameraPreview, 0, 0, captureCanvas.width, captureCanvas.height);
    
    // Apply filters if needed
    if (autoEnhance || currentFilter !== 'normal') {
        applyEnhancementFilter(context, captureCanvas.width, captureCanvas.height);
    }
    
    // Get the captured image data
    const quality = scanQuality === 'high' ? 0.95 : (scanQuality === 'medium' ? 0.85 : 0.75);
    const imageData = captureCanvas.toDataURL('image/jpeg', quality);
    capturedImages.push(imageData);
    
    // Show the captured image
    showCapturedImage(imageData);
    
    // Generate PDF
    generatePDF();
}

// Play capture sound effect
function playCaptureSoundEffect() {
    const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjM1LjEwNAAAAAAAAAAAAAAA//uQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwBK8AAAAAAAAAABUAJAJAQgAAgAAAA0L2YLwxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
    audio.play().catch(error => {
        console.log('Auto-play prevented for sound effect.');
    });
}

// Apply enhancement filter to improve image quality
function applyEnhancementFilter(context, width, height) {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply filter effects based on current filter and mode
    switch (currentFilter) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;     // R
                data[i + 1] = avg; // G
                data[i + 2] = avg; // B
            }
            break;
            
        case 'enhanced':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.2);       // R
                data[i + 1] = Math.min(255, data[i + 1] * 1.2); // G
                data[i + 2] = Math.min(255, data[i + 2] * 1.2); // B
            }
            break;
            
        case 'bw':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const val = avg > 128 ? 255 : 0;
                data[i] = val;     // R
                data[i + 1] = val; // G
                data[i + 2] = val; // B
            }
            break;
            
        case 'contrast':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.4 + 128));       // R
                data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.4 + 128)); // G
                data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.4 + 128)); // B
            }
            break;
            
        default:
            // For normal mode and when autoEnhance is true
            if (autoEnhance) {
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.1);       // R
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // G
                    data[i + 2] = Math.min(255, data[i + 2] * 1.1); // B
                }
            }
            break;
    }
    
    // Special handling for different modes
    if (currentMode === 'text' || currentMode === 'docs') {
        // Increase contrast slightly for better text readability
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.1 + 128));       // R
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.1 + 128)); // G
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.1 + 128)); // B
        }
    }
    
    context.putImageData(imageData, 0, 0);
}

// Show captured image and switch UI to review mode
function showCapturedImage(imageData) {
    // Hide camera preview and show captured image
    cameraPreview.style.display = 'none';
    capturedImageContainer.style.display = 'block';
    capturedImage.src = imageData;
    
    // Update buttons
    captureBtn.style.display = 'none';
    cancelBtn.style.display = 'flex';
    saveBtn.style.display = 'flex';
}

// Cancel current capture and return to camera mode
function cancelCapture() {
    // Remove the last captured image
    capturedImages.pop();
    
    // If we still have images, show the last one
    if (capturedImages.length > 0) {
        showCapturedImage(capturedImages[capturedImages.length - 1]);
    } else {
        // Otherwise return to camera mode
        returnToCameraMode();
    }
}

// Return to camera mode
function returnToCameraMode() {
    // Show camera preview and hide captured image
    cameraPreview.style.display = 'block';
    capturedImageContainer.style.display = 'none';
    
    // Reset buttons
    captureBtn.style.display = 'flex';
    cancelBtn.style.display = 'none';
    saveBtn.style.display = 'none';
}

// Save capture and generate PDF
function saveCapture() {
    // Show PDF preview
    openPdfPreview();
}

// Generate PDF from captured images
function generatePDF() {
    // Use jsPDF to create a new PDF
    const { jsPDF } = window.jspdf;
    
    // Set page format based on settings
    let options = {
        orientation: 'portrait',
        unit: 'mm'
    };
    
    if (pdfFormat !== 'auto') {
        options.format = pdfFormat;
    }
    
    const pdf = new jsPDF(options);
    
    // Process each captured image
    let prom = Promise.resolve();
    
    capturedImages.forEach((imgData, index) => {
        prom = prom.then(() => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = imgData;
                
                img.onload = function() {
                    // Calculate aspect ratio to fit image in PDF
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    
                    let pdfWidth = pageWidth - 10; // Add some margin
                    let pdfHeight = (imgHeight * pdfWidth) / imgWidth;
                    
                    // If the image is too tall, scale based on height
                    if (pdfHeight > pageHeight - 10) {
                        pdfHeight = pageHeight - 10;
                        pdfWidth = (imgWidth * pdfHeight) / imgHeight;
                    }
                    
                    // Center the image
                    const xOffset = (pageWidth - pdfWidth) / 2;
                    const yOffset = (pageHeight - pdfHeight) / 2;
                    
                    // Add new page if not the first image
                    if (index > 0) {
                        pdf.addPage();
                    }
                    
                    // Add image to PDF
                    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, pdfWidth, pdfHeight, null, 'FAST');
                    
                    // Add page number if multiple pages
                    if (capturedImages.length > 1) {
                        pdf.setFontSize(8);
                        pdf.setTextColor(100, 100, 100);
                        pdf.text(`${index + 1}/${capturedImages.length}`, pageWidth - 10, pageHeight - 5);
                    }
                    
                    resolve();
                };
            });
        });
    });
    
    // When all images are processed, create PDF blob
    prom.then(() => {
        currentPdfBlob = pdf.output('blob');
        
        // Create object URL for the blob
        const pdfUrl = URL.createObjectURL(currentPdfBlob);
        
        // Update iframe source
        pdfIframe.src = pdfUrl;
    });
}

// Open PDF preview modal
function openPdfPreview() {
    if (!currentPdfBlob) return;
    
    pdfPreviewModal.style.display = 'flex';
}

// Close modal
function closeModal() {
    pdfPreviewModal.style.display = 'none';
    
    // Return to camera mode if we were in capture mode
    if (cameraPreview.style.display === 'none') {
        returnToCameraMode();
    }
}

// Download PDF
function downloadPdf() {
    if (!currentPdfBlob) return;
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create filename based on current mode
    let filePrefix = 'scanned-document';
    switch (currentMode) {
        case 'book':
            filePrefix = 'scanned-book';
            break;
        case 'text':
            filePrefix = 'scanned-text';
            break;
        case 'docs':
            filePrefix = 'scanned-document';
            break;
        case 'idcard':
            filePrefix = 'scanned-idcard';
            break;
        case 'qrcode':
            filePrefix = 'scanned-qrcode';
            break;
    }
    
    const filename = `${filePrefix}-${timestamp}.pdf`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(currentPdfBlob);
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    // Close modal
    closeModal();
    
    // Reset captured images and return to camera mode
    capturedImages = [];
    returnToCameraMode();
    
    showNotification('PDF सफलतापूर्वक डाउनलोड किया गया');
}

// Handle Flash Button Click
function handleFlashBtn() {
    if (!hasFlash || !stream) {
        showNotification('कैमरा फ्लैश उपलब्ध नहीं है');
        return;
    }
    
    toggleFlash();
    
    // Toggle active state of the button
    flashBtn.classList.toggle('active', flashOn);
}

// Toggle HD Mode
function toggleHDMode() {
    hdMode = !hdMode;
    
    // Toggle active state of the button
    hdBtn.classList.toggle('active', hdMode);
    
    // Update camera constraints if stream is active
    if (stream) {
        restartCameraWithNewConstraints();
    }
    
    // Show better notification with HD icon
    showNotification(`<i class="fas fa-hd" style="color:${hdMode ? '#007bff' : 'white'}"></i> ${hdMode ? 'HD मोड चालू' : 'HD मोड बंद'}`);
}

// Restart camera with new constraints
async function restartCameraWithNewConstraints() {
    if (!stream) return;
    
    // Store old tracks to stop after new stream is established
    const oldTracks = stream.getTracks();
    
    // Request camera access with new resolution based on HD mode
    const constraints = {
        video: {
            facingMode: 'environment',
            width: hdMode ? { ideal: 3840 } : { ideal: 1920 },
            height: hdMode ? { ideal: 2160 } : { ideal: 1080 },
            advanced: [{ zoom: hdMode ? 1.5 : 1.0 }] // Optical zoom if available
        }
    };
    
    try {
        // First attempt to get the new stream before stopping the old one
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Only stop old tracks after successfully getting new stream
        oldTracks.forEach(track => track.stop());
        
        // Set the new stream
        stream = newStream;
        cameraPreview.srcObject = stream;
        
        // Re-check flash availability with new stream
        checkFlashAvailability();
        
        // Update HD icon visibility
        updateHDIndicator();
    } catch (error) {
        console.error('Error restarting camera:', error);
        
        // Show more helpful error message
        showNotification('कैमरा रीस्टार्ट में समस्या हुई, कृपया पुनः प्रयास करें', 'error');
    }
}

// Add new function to update HD indicator
function updateHDIndicator() {
    const hdIndicator = document.getElementById('hd-indicator');
    
    if (hdMode) {
        hdBtn.innerHTML = '<i class="fas fa-hd" style="color: #007bff;"></i><span style="color: #007bff; font-weight: bold;">HD</span>';
        // Show the HD indicator on camera preview
        hdIndicator.style.display = 'block';
    } else {
        hdBtn.innerHTML = '<i class="fas fa-hd"></i><span>HD</span>';
        // Hide the HD indicator
        hdIndicator.style.display = 'none';
    }
}

// Toggle Grid Overlay
function toggleGrid() {
    gridVisible = !gridVisible;
    gridOverlay.style.display = gridVisible ? 'block' : 'none';
    gridBtn.classList.toggle('active', gridVisible);
}

// Open Filter Modal
function openFilterModal() {
    filterModal.style.display = 'flex';
    
    // Mark current filter as active
    filterOptions.forEach(option => {
        const filter = option.getAttribute('data-filter');
        option.classList.toggle('active', filter === currentFilter);
    });
}

// Close Filter Modal
function closeFilterModal() {
    filterModal.style.display = 'none';
}

// Apply selected filter
function applyFilter(filter) {
    currentFilter = filter;
    
    // Apply filter to camera preview
    switch (filter) {
        case 'normal':
            cameraPreview.style.filter = 'none';
            break;
        case 'grayscale':
            cameraPreview.style.filter = 'grayscale(100%)';
            break;
        case 'enhanced':
            cameraPreview.style.filter = 'contrast(120%) brightness(110%)';
            break;
        case 'bw':
            cameraPreview.style.filter = 'grayscale(100%) contrast(150%) brightness(120%)';
            break;
        case 'contrast':
            cameraPreview.style.filter = 'contrast(140%)';
            break;
    }
    
    // Update filter button to show it's active
    filterBtn.classList.add('active');
    
    showNotification(`${filter} फिल्टर लागू किया गया`);
}

// Open Settings Modal
function openSettingsModal() {
    settingsModal.style.display = 'flex';
    
    // Set current values
    qualitySetting.value = scanQuality;
    formatSetting.value = pdfFormat;
    autoEnhanceToggle.checked = autoEnhance;
    darkModeToggle.checked = isDarkMode;
}

// Close Settings Modal
function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

// Update Quality Setting
function updateQualitySetting() {
    scanQuality = qualitySetting.value;
    showNotification(`स्कैन क्वालिटी: ${scanQuality}`);
}

// Update Format Setting
function updateFormatSetting() {
    pdfFormat = formatSetting.value;
    showNotification(`PDF फॉर्मेट: ${pdfFormat}`);
}

// Update Auto Enhance Setting
function updateAutoEnhance() {
    autoEnhance = autoEnhanceToggle.checked;
}

// Update Dark Mode Setting
function updateDarkModeSetting() {
    isDarkMode = darkModeToggle.checked;
    
    // Apply dark mode changes
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        cameraPreview.style.filter = 'none';
    } else {
        document.body.classList.remove('dark-mode');
        modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        cameraPreview.style.filter = 'brightness(1.2) contrast(1.2)';
    }
}

// Switch between different scanning modes
function switchMode(mode) {
    if (mode === currentMode) return;
    
    // Remove active class from all mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected mode button
    document.getElementById(`${mode}-mode`).classList.add('active');
    
    // Save current mode
    currentMode = mode;
    
    // Adjust UI based on mode
    adjustUIForMode(mode);
    
    showNotification(`${mode} मोड चालू`);
}

// Adjust UI based on selected mode
function adjustUIForMode(mode) {
    // Reset any mode-specific settings
    gridOverlay.style.display = 'none';
    gridVisible = false;
    gridBtn.classList.remove('active');
    
    switch (mode) {
        case 'book':
            // Show grid for book alignment
            gridOverlay.style.display = 'block';
            gridVisible = true;
            gridBtn.classList.add('active');
            break;
            
        case 'text':
            // Apply high contrast filter for better text recognition
            applyFilter('enhanced');
            break;
            
        case 'docs':
            // Default document scanning mode
            applyFilter('normal');
            break;
            
        case 'idcard':
            // Show grid for ID card alignment
            gridOverlay.style.display = 'block';
            gridVisible = true;
            gridBtn.classList.add('active');
            applyFilter('enhanced');
            break;
            
        case 'qrcode':
            // Enhance contrast for QR code scanning
            applyFilter('contrast');
            break;
            
        case 'import':
            // This is handled by the file input click
            break;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '8px';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        document.body.appendChild(notification);
    }
    
    // Set color based on type
    if (type === 'error') {
        notification.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
    } else if (type === 'success') {
        notification.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
    } else {
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    }
    
    // Set message
    notification.innerHTML = message;
    
    // Show notification
    notification.style.opacity = '1';
    
    // Auto hide after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
    
    notification.style.display = 'block';
}

// Update camera device list
async function updateCameraDeviceList() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter(device => device.kind === 'videoinput');
        console.log('कैमरा सूची अपडेट की गई:', availableCameras);
        
        // Update camera switch button visibility
        cameraSwitchBtn.style.display = availableCameras.length > 1 ? 'flex' : 'none';
        
        // Show notification if new cameras connected
        if (availableCameras.length > 1) {
            showNotification(`${availableCameras.length} कैमरा मिले`, 'info');
        }
    } catch (error) {
        console.error('कैमरा डिवाइस लिस्ट अपडेट में त्रुटि:', error);
    }
}

// Switch between available cameras
async function switchCamera() {
    if (availableCameras.length <= 1) {
        showNotification('कोई अतिरिक्त कैमरा कनेक्टेड नहीं है', 'info');
        updateCameraDeviceList();
        return;
    }

    // Update current camera index
    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[currentCameraIndex];
    
    // Stop current stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    try {
        // Request the next camera
        const constraints = {
            video: {
                deviceId: { exact: nextCamera.deviceId },
                width: hdMode ? { ideal: 3840 } : { ideal: 1920 },
                height: hdMode ? { ideal: 2160 } : { ideal: 1080 }
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraPreview.srcObject = stream;
        
        // Check if flash is available
        checkFlashAvailability();
        
        // Apply current filter
        applyFilter(currentFilter);
        
        // Update HD indicator
        updateHDIndicator();
        
        // Show grid if enabled
        if (gridVisible) {
            gridOverlay.style.display = 'block';
        }
        
        // Show camera info
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const label = videoTrack.label || `कैमरा ${currentCameraIndex + 1}`;
            showNotification(`कैमरा बदला गया: ${label}`, 'success');
        }
    } catch (error) {
        console.error('कैमरा स्विच करने में त्रुटि:', error);
        showNotification('कैमरा स्विच करने में समस्या', 'error');
        
        // Try to switch back to the previously working camera
        currentCameraIndex = (currentCameraIndex - 1 + availableCameras.length) % availableCameras.length;
        restartCameraWithNewConstraints();
    }
}

// Initialize the app when document is loaded
document.addEventListener('DOMContentLoaded', initApp); 