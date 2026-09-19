/* =============================================
   Face Tracker - Eye Contact Detection
   Ported from useAdvancedFaceTracker.ts
   Uses face-api.js for face detection
   ============================================= */

var FaceTracker = {
    // State
    isInitialized: false,
    isRunning: false,
    videoElement: null,
    canvasElement: null,
    canvasCtx: null,
    
    // Eye contact tracking
    totalFrames: 0,
    goodFrames: 0,
    eyeContactPercent: 0,
    
    // Callbacks
    onEyeContactUpdate: null,
    
    // Animation
    animationId: null,
    
    /**
     * Initialize face tracker
     */
    init: function(videoId, canvasId) {
        this.videoElement = document.getElementById(videoId);
        this.canvasElement = document.getElementById(canvasId);
        
        if (!this.videoElement || !this.canvasElement) {
            console.log('Face tracker: video or canvas element not found');
            return false;
        }
        
        this.canvasCtx = this.canvasElement.getContext('2d');
        
        // Check if face-api is available
        if (typeof faceapi === 'undefined') {
            console.log('Face-api.js not loaded. Face tracking disabled.');
            this.startCameraOnly();
            return false;
        }
        
        return true;
    },
    
    /**
     * Start camera feed only (without face detection)
     */
    startCameraOnly: function() {
        var self = this;
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('Camera not supported');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' }
        })
        .then(function(stream) {
            self.videoElement.srcObject = stream;
            self.isRunning = true;
        })
        .catch(function(error) {
            console.log('Camera access error: ' + error.message);
        });
    },
    
    /**
     * Load face-api models and start detection
     */
    start: function() {
        var self = this;
        
        if (!this.init) {
            return;
        }
        
        // Start camera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('Camera not supported');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' }
        })
        .then(function(stream) {
            self.videoElement.srcObject = stream;
            self.isRunning = true;
            
            // Load face-api models if available
            if (typeof faceapi !== 'undefined') {
                self.loadModels();
            }
        })
        .catch(function(error) {
            console.log('Camera access error: ' + error.message);
        });
    },
    
    /**
     * Load face-api.js models
     */
    loadModels: function() {
        var self = this;
        var modelPath = '/static/models';
        
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath)
        ])
        .then(function() {
            console.log('Face detection models loaded');
            self.isInitialized = true;
            self.startDetection();
        })
        .catch(function(error) {
            console.log('Failed to load face models: ' + error.message);
        });
    },
    
    /**
     * Start face detection loop
     */
    startDetection: function() {
        var self = this;
        
        function detect() {
            if (!self.isRunning || !self.isInitialized) return;
            
            if (self.videoElement.readyState === 4) {
                // Set canvas size to match video
                self.canvasElement.width = self.videoElement.videoWidth || 320;
                self.canvasElement.height = self.videoElement.videoHeight || 240;
                
                var options = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 160,
                    scoreThreshold: 0.3
                });
                
                faceapi.detectSingleFace(self.videoElement, options)
                    .withFaceLandmarks(true)
                    .then(function(detection) {
                        // Clear canvas
                        self.canvasCtx.clearRect(0, 0, self.canvasElement.width, self.canvasElement.height);
                        
                        self.totalFrames = self.totalFrames + 1;
                        
                        if (detection) {
                            // Draw face bounding box
                            var box = detection.detection.box;
                            self.canvasCtx.strokeStyle = '#4f8cff';
                            self.canvasCtx.lineWidth = 2;
                            self.canvasCtx.strokeRect(box.x, box.y, box.width, box.height);
                            
                            // Check eye contact
                            var landmarks = detection.landmarks;
                            var leftEye = landmarks.getLeftEye();
                            var rightEye = landmarks.getRightEye();
                            
                            // Calculate eye midpoint
                            var eyeMidX = 0;
                            var eyeMidY = 0;
                            var totalPoints = 0;
                            
                            for (var i = 0; i < leftEye.length; i++) {
                                eyeMidX = eyeMidX + leftEye[i].x;
                                eyeMidY = eyeMidY + leftEye[i].y;
                                totalPoints = totalPoints + 1;
                            }
                            for (var j = 0; j < rightEye.length; j++) {
                                eyeMidX = eyeMidX + rightEye[j].x;
                                eyeMidY = eyeMidY + rightEye[j].y;
                                totalPoints = totalPoints + 1;
                            }
                            
                            eyeMidX = eyeMidX / totalPoints;
                            eyeMidY = eyeMidY / totalPoints;
                            
                            // Draw eye tracking circle
                            self.canvasCtx.beginPath();
                            self.canvasCtx.arc(eyeMidX, eyeMidY, 4, 0, Math.PI * 2);
                            self.canvasCtx.fillStyle = '#22c55e';
                            self.canvasCtx.fill();
                            
                            // Check if looking at camera (eye midpoint in center region)
                            var relX = eyeMidX / self.canvasElement.width;
                            var relY = eyeMidY / self.canvasElement.height;
                            
                            var isLooking = (relX >= 0.3 && relX <= 0.7 && relY >= 0.15 && relY <= 0.6);
                            
                            if (isLooking) {
                                self.goodFrames = self.goodFrames + 1;
                            }
                        }
                        
                        // Calculate percentage
                        if (self.totalFrames > 0) {
                            self.eyeContactPercent = Math.round((self.goodFrames / self.totalFrames) * 100);
                        }
                        
                        if (self.onEyeContactUpdate) {
                            self.onEyeContactUpdate(self.eyeContactPercent);
                        }
                        
                        // Continue loop
                        self.animationId = requestAnimationFrame(detect);
                    })
                    .catch(function() {
                        self.animationId = requestAnimationFrame(detect);
                    });
            } else {
                self.animationId = requestAnimationFrame(detect);
            }
        }
        
        detect();
    },
    
    /**
     * Stop face tracker
     */
    stop: function() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.videoElement && this.videoElement.srcObject) {
            var tracks = this.videoElement.srcObject.getTracks();
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].stop();
            }
            this.videoElement.srcObject = null;
        }
    },
    
    /**
     * Toggle tracker visibility
     */
    toggleVisibility: function() {
        var body = document.getElementById('trackerBody');
        if (body) {
            if (body.style.display === 'none') {
                body.style.display = 'block';
            } else {
                body.style.display = 'none';
            }
        }
    },
    
    /**
     * Get current eye contact percentage
     */
    getEyeContact: function() {
        return this.eyeContactPercent;
    },
    
    /**
     * Reset tracking stats
     */
    reset: function() {
        this.totalFrames = 0;
        this.goodFrames = 0;
        this.eyeContactPercent = 0;
    }
};

/**
 * Toggle face tracker panel
 */
function toggleTracker() {
    FaceTracker.toggleVisibility();
}
