/* =============================================
   Voice Engine - Speech-to-Text & Text-to-Speech
   Ported from useVoiceEngine.ts
   ============================================= */

var VoiceEngine = {
    // State
    recognition: null,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    silenceTimer: null,
    safetyTimer: null,
    silenceDelay: 2500,  // 2.5 seconds silence = auto submit
    safetyDelay: 5000,   // 5 seconds max wait
    
    // Audio analysis
    audioContext: null,
    analyser: null,
    microphone: null,
    mediaStream: null,
    volume: 0,
    
    // TTS
    isSpeaking: false,
    speechSynthesis: window.speechSynthesis || null,
    resumeInterval: null,
    
    // Callbacks
    onTranscriptUpdate: null,
    onSilenceCommit: null,
    onVolumeUpdate: null,
    onSpeakingChange: null,
    
    /**
     * Initialize speech recognition
     */
    init: function() {
        // Setup Speech Recognition
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.log('Speech Recognition not supported in this browser');
            return false;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        var self = this;
        
        this.recognition.onresult = function(event) {
            var finalText = '';
            var interimText = '';
            
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var result = event.results[i];
                if (result.isFinal) {
                    finalText = finalText + result[0].transcript;
                } else {
                    interimText = interimText + result[0].transcript;
                }
            }
            
            if (finalText !== '') {
                self.transcript = self.transcript + finalText;
            }
            self.interimTranscript = interimText;
            
            // Update callback
            if (self.onTranscriptUpdate) {
                self.onTranscriptUpdate(self.transcript + self.interimTranscript);
            }
            
            // Reset silence timer on new speech
            self.resetSilenceTimer();
        };
        
        this.recognition.onerror = function(event) {
            console.log('Speech recognition error: ' + event.error);
            if (event.error === 'no-speech' || event.error === 'aborted') {
                // These are normal, restart if still listening
                if (self.isListening) {
                    try {
                        self.recognition.start();
                    } catch(e) {
                        // Already started
                    }
                }
            }
        };
        
        this.recognition.onend = function() {
            // Auto restart if still supposed to be listening
            if (self.isListening) {
                try {
                    self.recognition.start();
                } catch(e) {
                    // Already started
                }
            }
        };
        
        return true;
    },
    
    /**
     * Start listening
     */
    startListening: function() {
        if (!this.recognition) {
            var initialized = this.init();
            if (!initialized) return false;
        }
        
        this.isListening = true;
        this.transcript = '';
        this.interimTranscript = '';
        
        try {
            this.recognition.start();
        } catch(e) {
            // Already started
        }
        
        // Start microphone volume analysis
        this.startVolumeAnalysis();
        
        return true;
    },
    
    /**
     * Stop listening
     */
    stopListening: function() {
        this.isListening = false;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch(e) {
                // Already stopped
            }
        }
        
        this.clearTimers();
        this.stopVolumeAnalysis();
    },
    
    /**
     * Reset silence timer - called when new speech detected
     */
    resetSilenceTimer: function() {
        var self = this;
        
        // Clear existing timers
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }
        if (this.safetyTimer) {
            clearTimeout(this.safetyTimer);
        }
        
        // Set silence timer
        this.silenceTimer = setTimeout(function() {
            // Silence detected - commit the transcript
            if (self.transcript.trim() !== '' && self.onSilenceCommit) {
                self.onSilenceCommit(self.transcript.trim());
                self.stopListening();
            }
        }, this.silenceDelay);
        
        // Set safety timer
        this.safetyTimer = setTimeout(function() {
            if (self.transcript.trim() !== '' && self.onSilenceCommit) {
                self.onSilenceCommit(self.transcript.trim());
                self.stopListening();
            }
        }, this.safetyDelay);
    },
    
    /**
     * Clear all timers
     */
    clearTimers: function() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
        if (this.safetyTimer) {
            clearTimeout(this.safetyTimer);
            this.safetyTimer = null;
        }
    },
    
    /**
     * Start microphone volume analysis using Web Audio API
     */
    startVolumeAnalysis: function() {
        var self = this;
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('getUserMedia not supported');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            self.mediaStream = stream;
            self.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            self.analyser = self.audioContext.createAnalyser();
            self.analyser.fftSize = 256;
            
            self.microphone = self.audioContext.createMediaStreamSource(stream);
            self.microphone.connect(self.analyser);
            
            // Start reading volume
            self.readVolume();
        })
        .catch(function(error) {
            console.log('Microphone access error: ' + error.message);
        });
    },
    
    /**
     * Read volume from analyser
     */
    readVolume: function() {
        if (!this.analyser || !this.isListening) return;
        
        var dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        var sum = 0;
        for (var i = 0; i < dataArray.length; i++) {
            sum = sum + dataArray[i];
        }
        var average = sum / dataArray.length;
        
        // Normalize to 0-100
        this.volume = Math.min(100, Math.round(average * 100 / 128));
        
        if (this.onVolumeUpdate) {
            this.onVolumeUpdate(this.volume, dataArray);
        }
        
        var self = this;
        requestAnimationFrame(function() {
            self.readVolume();
        });
    },
    
    /**
     * Stop volume analysis
     */
    stopVolumeAnalysis: function() {
        if (this.mediaStream) {
            var tracks = this.mediaStream.getTracks();
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].stop();
            }
            this.mediaStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyser = null;
        this.microphone = null;
        this.volume = 0;
    },
    
    /**
     * Speak text using Text-to-Speech
     */
    speak: function(text, onDone) {
        if (!this.speechSynthesis) {
            console.log('Speech synthesis not supported');
            if (onDone) onDone();
            return;
        }
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a natural English voice
        var voices = this.speechSynthesis.getVoices();
        var selectedVoice = null;
        
        for (var i = 0; i < voices.length; i++) {
            var voice = voices[i];
            var name = voice.name.toLowerCase();
            
            // Prefer natural/Google voices
            if (name.indexOf('google') !== -1 && name.indexOf('us') !== -1) {
                selectedVoice = voice;
                break;
            }
            if (name.indexOf('natural') !== -1 || name.indexOf('samantha') !== -1) {
                selectedVoice = voice;
                break;
            }
            if (voice.lang.startsWith('en') && !selectedVoice) {
                selectedVoice = voice;
            }
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        var self = this;
        
        utterance.onstart = function() {
            self.isSpeaking = true;
            if (self.onSpeakingChange) {
                self.onSpeakingChange(true);
            }
            
            // Chrome bug fix: resume every 14 seconds
            self.resumeInterval = setInterval(function() {
                if (self.speechSynthesis && self.isSpeaking) {
                    self.speechSynthesis.resume();
                }
            }, 14000);
        };
        
        utterance.onend = function() {
            self.isSpeaking = false;
            if (self.resumeInterval) {
                clearInterval(self.resumeInterval);
                self.resumeInterval = null;
            }
            if (self.onSpeakingChange) {
                self.onSpeakingChange(false);
            }
            if (onDone) onDone();
        };
        
        utterance.onerror = function() {
            self.isSpeaking = false;
            if (self.resumeInterval) {
                clearInterval(self.resumeInterval);
            }
            if (onDone) onDone();
        };
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Stop speaking
     */
    stopSpeaking: function() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        if (this.resumeInterval) {
            clearInterval(this.resumeInterval);
            this.resumeInterval = null;
        }
    },
    
    /**
     * Get current transcript
     */
    getTranscript: function() {
        return this.transcript.trim();
    },
    
    /**
     * Clear transcript
     */
    clearTranscript: function() {
        this.transcript = '';
        this.interimTranscript = '';
    },
    
    /**
     * Cleanup everything
     */
    destroy: function() {
        this.stopListening();
        this.stopSpeaking();
        this.clearTimers();
    }
};

// Make sure voices are loaded
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function() {
        // Voices loaded
    };
}
