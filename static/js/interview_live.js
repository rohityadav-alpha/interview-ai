/* =============================================
   Interview Live - Main interview page controller
   ============================================= */

var InterviewController = {
    // State
    interviewId: 0,
    questions: [],
    currentQuestionIndex: 0,
    conversationHistory: [],
    isSubmitting: false,
    startTime: 0,
    timerInterval: null,
    elapsedSeconds: 0,
    
    /**
     * Initialize the interview
     */
    init: function() {
        var page = document.getElementById('interviewPage');
        if (!page) return;
        
        this.interviewId = parseInt(page.getAttribute('data-interview-id'));
        this.startTime = Date.now();
        
        // Start timer
        this.startTimer();
        
        // Load questions
        this.loadQuestions();
        
        // Initialize voice engine
        VoiceEngine.init();
        
        // Set up voice callbacks
        var self = this;
        
        VoiceEngine.onTranscriptUpdate = function(text) {
            // Show live transcription in the display area
            var transcriptionText = document.getElementById('transcriptionText');
            if (transcriptionText) {
                transcriptionText.textContent = text;
                transcriptionText.className = 'transcription-text active';
            }
            // Also fill the textarea so user can edit
            var textAnswer = document.getElementById('textAnswer');
            if (textAnswer) {
                textAnswer.value = text;
            }
        };
        
        VoiceEngine.onSilenceCommit = function(text) {
            // On silence, copy final text to textarea for editing
            // Do NOT auto-submit — let user review and click SUBMIT
            var textAnswer = document.getElementById('textAnswer');
            if (textAnswer && text && text.trim() !== '') {
                textAnswer.value = text;
            }
            // Stop mic automatically after silence
            VoiceEngine.stopListening();
            var micBtn = document.getElementById('micBtn');
            var statusText = document.getElementById('statusText');
            var voiceStatus = document.getElementById('voiceStatus');
            if (micBtn) micBtn.classList.remove('active');
            if (statusText) statusText.textContent = 'Review your answer below and click SUBMIT';
            if (voiceStatus) voiceStatus.className = 'voice-status';
        };
        
        VoiceEngine.onVolumeUpdate = function(volume, dataArray) {
            self.drawWaveform(volume, dataArray);
        };
        
        // Initialize face tracker
        FaceTracker.init('cameraFeed', 'faceOverlay');
        FaceTracker.start();
        
        FaceTracker.onEyeContactUpdate = function(percent) {
            var fill = document.getElementById('eyeContactFill');
            var value = document.getElementById('eyeContactValue');
            if (fill) fill.style.width = percent + '%';
            if (value) value.textContent = percent + '%';
            
            // Color based on percentage
            if (fill) {
                if (percent >= 70) {
                    fill.style.background = '#22c55e';
                } else if (percent >= 40) {
                    fill.style.background = '#eab308';
                } else {
                    fill.style.background = '#ef4444';
                }
            }
        };
    },
    
    /**
     * Start interview timer
     */
    startTimer: function() {
        var self = this;
        this.timerInterval = setInterval(function() {
            self.elapsedSeconds = self.elapsedSeconds + 1;
            var display = document.getElementById('timerDisplay');
            if (display) {
                display.textContent = formatTime(self.elapsedSeconds);
            }
        }, 1000);
    },
    
    /**
     * Load questions from API
     */
    loadQuestions: function() {
        var self = this;
        var url = '/api/interviews/' + this.interviewId + '/questions/';
        
        getJSON(url, function(error, data) {
            if (error) {
                showToast('Failed to load questions', 'error');
                return;
            }
            
            if (data.success) {
                self.questions = data.questions;
                
                // Find first unanswered question
                var startIndex = 0;
                for (var i = 0; i < self.questions.length; i++) {
                    if (self.questions[i].userAnswer === null || self.questions[i].userAnswer === '') {
                        startIndex = i;
                        break;
                    }
                }
                
                self.currentQuestionIndex = startIndex;
                self.displayQuestion(startIndex);
                
                // Speak the first question
                setTimeout(function() {
                    VoiceEngine.speak(self.questions[startIndex].question);
                }, 500);
            } else {
                showToast('Error loading questions: ' + (data.error || ''), 'error');
            }
        });
    },
    
    /**
     * Display a question
     */
    displayQuestion: function(index) {
        if (index >= this.questions.length) return;
        
        var question = this.questions[index];
        
        // Update question display
        var qNumber = document.getElementById('questionNumber');
        var qText = document.getElementById('questionText');
        if (qNumber) qNumber.textContent = 'Q' + (index + 1);
        if (qText) qText.textContent = question.question;
        
        // Update progress
        var progressText = document.getElementById('progressText');
        var progressFill = document.getElementById('progressFill');
        if (progressText) {
            progressText.textContent = 'Question ' + (index + 1) + ' of ' + this.questions.length;
        }
        if (progressFill) {
            var percent = ((index + 1) / this.questions.length) * 100;
            progressFill.style.width = percent + '%';
        }
        
        // Clear transcription
        var transcriptionText = document.getElementById('transcriptionText');
        if (transcriptionText) {
            transcriptionText.textContent = 'Your answer will appear here as you speak...';
            transcriptionText.className = 'transcription-text';
        }
        
        // Hide feedback panel
        var feedbackPanel = document.getElementById('feedbackPanel');
        if (feedbackPanel) feedbackPanel.style.display = 'none';
        
        // Clear text input
        var textAnswer = document.getElementById('textAnswer');
        if (textAnswer) textAnswer.value = '';
        
        // Reset voice
        VoiceEngine.clearTranscript();
    },
    
    /**
     * Submit an answer
     */
    submitAnswer: function(answerText) {
        if (this.isSubmitting) return;
        if (!answerText || answerText.trim() === '') {
            showToast('Please provide an answer first', 'warning');
            return;
        }
        
        this.isSubmitting = true;
        var self = this;
        var question = this.questions[this.currentQuestionIndex];
        
        // Update status
        var statusText = document.getElementById('statusText');
        var voiceStatus = document.getElementById('voiceStatus');
        if (statusText) statusText.textContent = 'AI is evaluating your answer...';
        if (voiceStatus) voiceStatus.className = 'voice-status processing';
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'interviewer',
            text: question.question
        });
        this.conversationHistory.push({
            role: 'candidate',
            text: answerText
        });
        
        // Send to API
        var url = '/api/interviews/' + this.interviewId + '/converse/';
        var requestData = {
            questionId: question.id,
            answer: answerText,
            conversationHistory: this.conversationHistory
        };
        
        postJSON(url, requestData, function(error, data) {
            self.isSubmitting = false;
            
            if (statusText) statusText.textContent = 'Click microphone to start speaking';
            if (voiceStatus) voiceStatus.className = 'voice-status';
            
            if (error) {
                showToast('Failed to submit answer', 'error');
                return;
            }
            
            if (data.success) {
                // Show feedback
                self.showFeedback(data);
                
                // Speak the AI response
                var spokenResponse = data.spokenResponse || data.feedback || '';
                if (spokenResponse !== '') {
                    VoiceEngine.speak(spokenResponse);
                }
            } else {
                showToast('Error: ' + (data.error || 'Failed to evaluate'), 'error');
            }
        });
    },
    
    /**
     * Show AI feedback
     */
    showFeedback: function(data) {
        var feedbackPanel = document.getElementById('feedbackPanel');
        var feedbackScore = document.getElementById('feedbackScore');
        var feedbackText = document.getElementById('feedbackText');
        
        if (feedbackPanel) feedbackPanel.style.display = 'block';
        if (feedbackScore) feedbackScore.textContent = data.score || '-';
        if (feedbackText) feedbackText.textContent = data.verboseFeedback || data.feedback || '';
        
        // Update button text for last question
        var nextBtn = document.getElementById('nextQuestionBtn');
        if (nextBtn) {
            if (this.currentQuestionIndex >= this.questions.length - 1) {
                nextBtn.textContent = 'Complete Interview ✓';
            } else {
                nextBtn.textContent = 'Next Question →';
            }
        }
    },
    
    /**
     * Move to next question
     */
    goToNext: function() {
        this.currentQuestionIndex = this.currentQuestionIndex + 1;
        
        if (this.currentQuestionIndex >= this.questions.length) {
            // Interview complete
            this.completeInterview();
            return;
        }
        
        // Display next question
        this.displayQuestion(this.currentQuestionIndex);
        
        // Speak the next question
        var self = this;
        setTimeout(function() {
            var question = self.questions[self.currentQuestionIndex];
            VoiceEngine.speak(question.question);
        }, 300);
    },
    
    /**
     * Skip current question
     */
    skipCurrentQuestion: function() {
        VoiceEngine.stopListening();
        VoiceEngine.stopSpeaking();
        this.goToNext();
    },
    
    /**
     * Complete the interview
     */
    completeInterview: function() {
        var self = this;
        
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Stop face tracker
        FaceTracker.stop();
        
        // Stop voice
        VoiceEngine.destroy();
        
        var url = '/api/interviews/' + this.interviewId + '/complete/';
        var requestData = {
            duration: this.elapsedSeconds
        };
        
        postJSON(url, requestData, function(error, data) {
            // Show completion modal
            var modal = document.getElementById('completeModal');
            if (modal) modal.style.display = 'flex';
            
            var reportBtn = document.getElementById('viewReportBtn');
            if (reportBtn) {
                reportBtn.href = '/reports/' + self.interviewId + '/';
            }
        });
    },
    
    /**
     * Draw waveform on canvas
     */
    drawWaveform: function(volume, dataArray) {
        var canvas = document.getElementById('waveformCanvas');
        if (!canvas) return;
        
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, width, height);
        
        if (!dataArray || dataArray.length === 0) return;
        
        // Draw waveform bars
        var barCount = 60;
        var barWidth = width / barCount;
        var step = Math.floor(dataArray.length / barCount);
        
        for (var i = 0; i < barCount; i++) {
            var value = dataArray[i * step] || 0;
            var barHeight = (value / 255) * height * 0.8;
            
            // Color based on whether listening or speaking
            if (VoiceEngine.isSpeaking) {
                ctx.fillStyle = '#22c55e';
            } else if (VoiceEngine.isListening) {
                ctx.fillStyle = '#4f8cff';
            } else {
                ctx.fillStyle = '#2a2a40';
            }
            
            var x = i * barWidth;
            var y = (height - barHeight) / 2;
            
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }
    }
};

// ---- Page-level event handlers ----

function toggleMicrophone() {
    var micBtn = document.getElementById('micBtn');
    var statusText = document.getElementById('statusText');
    var voiceStatus = document.getElementById('voiceStatus');
    
    if (VoiceEngine.isListening) {
        VoiceEngine.stopListening();
        if (micBtn) micBtn.classList.remove('active');
        if (statusText) statusText.textContent = 'Microphone off';
        if (voiceStatus) voiceStatus.className = 'voice-status';
    } else {
        var started = VoiceEngine.startListening();
        if (started) {
            if (micBtn) micBtn.classList.add('active');
            if (statusText) statusText.textContent = 'Listening... Speak your answer';
            if (voiceStatus) voiceStatus.className = 'voice-status listening';
        } else {
            showToast('Speech recognition not supported in this browser. Use text input instead.', 'warning');
        }
    }
}

function replayQuestion() {
    var question = InterviewController.questions[InterviewController.currentQuestionIndex];
    if (question) {
        VoiceEngine.speak(question.question);
    }
}

function skipQuestion() {
    InterviewController.skipCurrentQuestion();
}

function nextQuestion() {
    InterviewController.goToNext();
}

function submitTextAnswer() {
    var textInput = document.getElementById('textAnswer');
    if (textInput) {
        var answer = textInput.value.trim();
        if (answer !== '') {
            VoiceEngine.stopListening();
            InterviewController.submitAnswer(answer);
        } else {
            showToast('Please type your answer first', 'warning');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    var page = document.getElementById('interviewPage');
    if (page) {
        InterviewController.init();
    }
});
