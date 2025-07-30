document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const el = (id) => document.getElementById(id);
    
    const videoSelectionScreen = el('video-selection-screen');
    const fpsInputScreen = el('fps-input-screen');
    const editorScreen = el('editor-screen');
    
    const videoUpload = el('video-upload');
    const recordBtn = el('record-btn');
    const fpsInput = el('fps-input');
    const setFpsBtn = el('set-fps-btn');
    const fpsPresets = document.querySelectorAll('.fps-preset');
    
    const videoPlayer = el('video-player');
    const prevFrameBtn = el('prev-frame-btn');
    const nextFrameBtn = el('next-frame-btn');
    const currentTimeEl = el('current-time');
    const currentFrameEl = el('current-frame');
    const markTakeoffBtn = el('mark-takeoff-btn');
    const markLandingBtn = el('mark-landing-btn');
    const takeoffTimeEl = el('takeoff-time');
    const landingTimeEl = el('landing-time');
    const analyzeBtn = el('analyze-btn');
    const markHint = el('mark-hint');
    const analysisPreview = el('analysis-preview');
    const previewFlightTime = el('preview-flight-time');
    const previewHeight = el('preview-height');
    
    // State variables
    let takeoffTime = null;
    let landingTime = null;
    let frameDuration = 1 / 30;
    let fps = 30;
    let videoURL = null;
    let stream = null;
    let isRecording = false;
    
    // Constants
    const GRAVITY = 9.81; // m/s²
    
    // Utility functions
    function showScreen(screenToShow) {
        [videoSelectionScreen, fpsInputScreen, editorScreen].forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
        if (screenToShow) screenToShow.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function resetMarks() {
        takeoffTime = landingTime = null;
        takeoffTimeEl.textContent = 'Not set';
        landingTimeEl.textContent = 'Not set';
        analyzeBtn.disabled = true;
        markHint.textContent = '';
        analysisPreview.style.display = 'none';
    }
    
    function calculateJumpHeight(flightTimeSeconds) {
        // h = g * t² / 8 (projectile motion formula)
        return (GRAVITY * Math.pow(flightTimeSeconds, 2)) / 8;
    }
    
    function getCurrentFrame() {
        return Math.round(videoPlayer.currentTime * fps);
    }
    
    function updateFrameDisplay() {
        if (videoPlayer && !isNaN(videoPlayer.currentTime)) {
            currentTimeEl.textContent = `${videoPlayer.currentTime.toFixed(3)}s`;
            currentFrameEl.textContent = getCurrentFrame();
        }
    }
    
    function updatePreview() {
        if (takeoffTime !== null && landingTime !== null && landingTime > takeoffTime) {
            const flightTime = landingTime - takeoffTime;
            const height = calculateJumpHeight(flightTime);
            
            previewFlightTime.textContent = `${(flightTime * 1000).toFixed(0)} ms`;
            previewHeight.textContent = `${(height * 100).toFixed(1)} cm`;
            analysisPreview.style.display = 'block';
        } else {
            analysisPreview.style.display = 'none';
        }
    }
    
    // Video upload handling
    videoUpload.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                alert('Please upload a valid video file.');
                videoUpload.value = '';
                return;
            }
            
            if (videoURL) URL.revokeObjectURL(videoURL);
            videoURL = URL.createObjectURL(file);
            videoPlayer.srcObject = null;
            videoPlayer.src = videoURL;
            videoPlayer.load();
            resetMarks();
            
            // Try to extract frame rate from video metadata
            videoPlayer.addEventListener('loadedmetadata', () => {
                // Most browsers don't expose frame rate directly
                // Set a reasonable default
                fpsInput.value = 60;
            }, { once: true });
            
            showScreen(fpsInputScreen);
        }
    });
    
    // Video recording
    recordBtn.addEventListener('click', async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Video recording not supported on your device.");
            return;
        }
        
        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 60, min: 30 }
                },
                audio: false
            };
            
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoPlayer.srcObject = stream;
            videoPlayer.controls = true;
            videoPlayer.load();
            resetMarks();
            
            // Get actual frame rate from stream
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            if (settings.frameRate) {
                fpsInput.value = Math.round(settings.frameRate);
            }
            
            showScreen(fpsInputScreen);
        } catch (err) {
            alert("Could not access the camera. Grant permission or try another device.");
            console.error("getUserMedia error:", err);
        }
    });
    
    // FPS presets
    fpsPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const fps = preset.dataset.fps;
            fpsInput.value = fps;
            fpsInput.focus();
        });
    });
    
    // FPS confirmation
    setFpsBtn.addEventListener('click', () => {
        const inputFps = Number.parseFloat(fpsInput.value.trim());
        if (!inputFps || inputFps < 1 || inputFps > 1000 || !isFinite(inputFps)) {
            alert('Please enter a valid FPS value between 1 and 1000.');
            fpsInput.focus();
            return;
        }
        
        fps = inputFps;
        frameDuration = 1 / fps;
        videoPlayer.pause();
        
        // Stop recording if active
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        showScreen(editorScreen);
    });
    
    // Video player event handlers
    if (videoPlayer) {
        videoPlayer.addEventListener('loadeddata', () => {
            prevFrameBtn.disabled = false;
            nextFrameBtn.disabled = false;
            markTakeoffBtn.disabled = false;
            markLandingBtn.disabled = false;
            resetMarks();
            updateFrameDisplay();
        });
        
        videoPlayer.addEventListener('timeupdate', updateFrameDisplay);
        
        // Disable auto-play
        videoPlayer.addEventListener('loadedmetadata', () => {
            videoPlayer.pause();
        });
    }
    
    // Frame navigation
    prevFrameBtn.addEventListener('click', () => {
        if (videoPlayer.currentTime > 0) {
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - frameDuration);
        }
    });
    
    nextFrameBtn.addEventListener('click', () => {
        if (videoPlayer.currentTime < videoPlayer.duration) {
            videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + frameDuration);
        }
    });
    
    // Marker buttons
    markTakeoffBtn.addEventListener('click', () => {
        takeoffTime = videoPlayer.currentTime;
        takeoffTimeEl.textContent = `Take-off: ${takeoffTime.toFixed(3)}s (Frame ${getCurrentFrame()})`;
        markHint.textContent = "✓ Take-off marked! Now mark the landing frame.";
        markHint.style.color = 'var(--success-color)';
        updatePreview();
        checkAnalyzeButton();
    });
    
    markLandingBtn.addEventListener('click', () => {
        landingTime = videoPlayer.currentTime;
        landingTimeEl.textContent = `Landing: ${landingTime.toFixed(3)}s (Frame ${getCurrentFrame()})`;
        
        if (takeoffTime !== null && landingTime <= takeoffTime) {
            markHint.textContent = "⚠ Landing time must be after take-off. Please reselect.";
            markHint.style.color = 'var(--error-color)';
        } else {
            markHint.textContent = "✓ Landing marked! Ready to analyze your jump.";
            markHint.style.color = 'var(--success-color)';
        }
        
        updatePreview();
        checkAnalyzeButton();
    });
    
    function checkAnalyzeButton() {
        const isValid = takeoffTime !== null && landingTime !== null && landingTime > takeoffTime;
        analyzeBtn.disabled = !isValid;
        
        if (isValid) {
            analyzeBtn.textContent = 'Calculate Jump Height';
            analyzeBtn.classList.remove('btn-primary');
            analyzeBtn.classList.add('btn-success');
        } else {
            analyzeBtn.textContent = 'Mark Both Frames First';
            analyzeBtn.classList.remove('btn-success');
            analyzeBtn.classList.add('btn-primary');
        }
    }
    
    // Analysis
    analyzeBtn.addEventListener('click', () => {
        if (takeoffTime === null || landingTime === null) {
            alert("Please mark both take-off and landing frames.");
            return;
        }
        
        if (landingTime <= takeoffTime) {
            alert("Landing must occur after take-off. Please check your markers.");
            return;
        }
        
        const flightTime = landingTime - takeoffTime;
        const jumpHeight = calculateJumpHeight(flightTime);
        const takeoffVelocity = GRAVITY * flightTime / 2;
        
        // Store comprehensive results
        const results = {
            flightTime: flightTime.toFixed(4),
            jumpHeight: (jumpHeight * 100).toFixed(2), // Convert to cm
            takeoffVelocity: takeoffVelocity.toFixed(2),
            fps: fps.toString(),
            takeoffTime: takeoffTime.toFixed(3),
            landingTime: landingTime.toFixed(3),
            takeoffFrame: Math.round(takeoffTime * fps),
            landingFrame: Math.round(landingTime * fps),
            timestamp: new Date().toISOString()
        };
        
        // Store in localStorage
        localStorage.setItem('jumpResults', JSON.stringify(results));
        
        // Navigate to results
        window.location.href = 'results.html';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (editorScreen && !editorScreen.classList.contains('hidden')) {
            if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && !prevFrameBtn.disabled) {
                prevFrameBtn.click();
                e.preventDefault();
            }
            if ((e.key === "ArrowRight" || e.key.toLowerCase() === "d") && !nextFrameBtn.disabled) {
                nextFrameBtn.click();
                e.preventDefault();
            }
            if (e.key.toLowerCase() === "t" && !markTakeoffBtn.disabled) {
                markTakeoffBtn.click();
                e.preventDefault();
            }
            if (e.key.toLowerCase() === "l" && !markLandingBtn.disabled) {
                markLandingBtn.click();
                e.preventDefault();
            }
            if (e.key === " " && videoPlayer) {
                if (videoPlayer.paused) {
                    videoPlayer.play();
                } else {
                    videoPlayer.pause();
                }
                e.preventDefault();
            }
        }
    });
    
    // File upload accessibility
    const uploadLabel = document.querySelector('label[for="video-upload"]');
    if (uploadLabel) {
        uploadLabel.addEventListener('keydown', (e) => {
            if (e.key === "Enter" || e.key === " ") {
                videoUpload.click();
                e.preventDefault();
            }
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (videoURL) {
            URL.revokeObjectURL(videoURL);
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
    
    // Initialize
    showScreen(videoSelectionScreen);
});
