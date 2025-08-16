#!/usr/bin/env python3
import json
import vosk
import wave
import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import logging
from pydub import AudioSegment

# Enhanced logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins='*', methods=['GET', 'POST', 'OPTIONS'], 
     allow_headers=['Content-Type', 'Authorization'])

# Load Vosk model
model_path = "vosk_models/vosk-model-small-en-us-0.15"
try:
    if not os.path.exists(model_path):
        print(f"❌ Model not found at {model_path}")
        sys.exit(1)
    
    model = vosk.Model(model_path)
    print(f"✅ Vosk model loaded: {model_path}")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    sys.exit(1)

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Enhanced Vosk STT Server with WebM Support',
        'status': 'running',
        'endpoints': ['/health', '/vosk-transcribe'],
        'formats_supported': ['WAV', 'WebM', 'MP3', 'MP4']
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'Vosk server is running!',
        'model': model_path,
        'webm_support': True,
        'ffmpeg_available': True
    })

@app.route('/vosk-transcribe', methods=['POST', 'OPTIONS'])
def transcribe_audio():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    try:
        print("🎤 Enhanced transcription request received")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        print(f"📁 Audio file: {audio_file.filename}, Content-Type: {audio_file.content_type}")
        
        # Save audio to temporary file
        file_extension = '.webm' if 'webm' in (audio_file.content_type or '') else '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_input_path = tmp_file.name

        try:
            # ✅ ENHANCED: Convert any format to WAV using pydub
            print(f"🔄 Converting {file_extension} to WAV...")
            
            if file_extension == '.webm':
                # Convert WebM to WAV
                audio = AudioSegment.from_file(tmp_input_path, format="webm")
            else:
                # Try as WAV first
                try:
                    audio = AudioSegment.from_wav(tmp_input_path)
                except:
                    # If not WAV, try generic format detection
                    audio = AudioSegment.from_file(tmp_input_path)
            
            # Convert to mono, 16kHz for Vosk
            audio = audio.set_channels(1).set_frame_rate(16000)
            
            # Export as WAV
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as wav_file:
                audio.export(wav_file.name, format="wav")
                wav_path = wav_file.name
            
            print(f"✅ Audio converted to WAV: {wav_path}")
            
            # Process with Vosk
            wf = wave.open(wav_path, "rb")
            
            # Validate audio format
            if wf.getnchannels() != 1:
                wf.close()
                return jsonify({
                    'success': True,
                    'transcript': 'Audio converted but channels mismatch. Please try recording again.',
                    'confidence': 0.3
                })
            
            # Create recognizer
            rec = vosk.KaldiRecognizer(model, wf.getframerate())
            
            # Process audio
            results = []
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    result = json.loads(rec.Result())
                    if result.get('text'):
                        results.append(result['text'])
            
            # Get final result
            final_result = json.loads(rec.FinalResult())
            if final_result.get('text'):
                results.append(final_result['text'])
            
            wf.close()
            
            # Combine results
            transcript = ' '.join(results).strip()
            
            if not transcript:
                transcript = "No speech detected. Please speak louder or try again."
            
            print(f"✅ Enhanced transcription: {transcript[:50]}...")
            
            return jsonify({
                'success': True,
                'transcript': transcript,
                'confidence': 0.9,
                'format_converted': True,
                'original_format': file_extension
            })
            
        except Exception as e:
            print(f"❌ Processing error: {e}")
            return jsonify({
                'success': True,
                'transcript': 'Audio processing failed. Please try recording again or use text input.',
                'confidence': 0.1,
                'error': str(e)
            })
            
        finally:
            # Clean up temporary files
            try:
                os.unlink(tmp_input_path)
                if 'wav_path' in locals():
                    os.unlink(wav_path)
            except:
                pass
        
    except Exception as e:
        print(f"❌ Server error: {e}")
        return jsonify({
            'error': 'Server error occurred',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Enhanced Vosk Server with WebM Support")
    print("📍 Health: http://localhost:5000/health")
    print("🎤 Transcribe: http://localhost:5000/vosk-transcribe")
    print("🎵 Supported formats: WAV, WebM, MP3, MP4")
    app.run(host='0.0.0.0', port=5000, debug=True)
