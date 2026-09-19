import os
import json
from google import genai
from django.conf import settings


def get_api_keys():
    """Get all available Gemini API keys"""
    all_keys = []

    key1 = settings.GOOGLE_GEMINI_API_KEY
    if key1 and key1 != '':
        all_keys.append(key1)

    key2 = settings.GOOGLE_GEMINI_API_KEY_1
    if key2 and key2 != '':
        all_keys.append(key2)

    key3 = settings.GOOGLE_GEMINI_API_KEY_2
    if key3 and key3 != '':
        all_keys.append(key3)

    return all_keys


def call_gemini(prompt, temperature=0.7):
    """Call Gemini API with key rotation fallback using new google-genai SDK"""
    api_keys = get_api_keys()

    if len(api_keys) == 0:
        print('No API keys configured!')
        return None

    # Try each key one by one
    for i in range(len(api_keys)):
        try:
            client = genai.Client(api_key=api_keys[i])

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={
                    'temperature': temperature,
                    'max_output_tokens': 8192,
                }
            )
            return response.text
        except Exception as e:
            error_message = str(e)
            print('Gemini API key ' + str(i) + ' failed: ' + error_message)
            # If this is the last key, return None
            if i == len(api_keys) - 1:
                print('All API keys exhausted')
                return None
            # Otherwise try next key
            continue

    return None


def clean_json_response(text):
    """Remove markdown code fences and clean JSON from AI response"""
    if text is None:
        return ''

    # Remove ```json ... ``` markdown fences
    cleaned = text.strip()
    if cleaned.startswith('```json'):
        cleaned = cleaned[7:]  # Remove ```json
    if cleaned.startswith('```'):
        cleaned = cleaned[3:]  # Remove ```
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]  # Remove trailing ```

    cleaned = cleaned.strip()
    return cleaned


def generate_interview_questions(skill, difficulty='medium', count=10):
    """Generate interview questions using Gemini AI"""
    prompt = (
        'You are a professional technical interviewer. '
        'Generate exactly ' + str(count) + ' ' + difficulty + ' difficulty level '
        'interview questions for the skill: ' + skill + '.\n\n'
        'IMPORTANT RULES:\n'
        '1. Questions should be practical and test real understanding\n'
        '2. Mix different types: conceptual, scenario-based, problem-solving\n'
        '3. Questions should be progressively challenging\n'
        '4. Return ONLY a JSON array, no other text\n\n'
        'Return format (strict JSON):\n'
        '[{"question": "Your question here"}, {"question": "Next question"}]\n\n'
        'Generate exactly ' + str(count) + ' questions now.'
    )

    response_text = call_gemini(prompt, temperature=0.7)

    if response_text is None:
        # Return fallback questions if AI fails
        fallback_questions = []
        for i in range(count):
            q = {'question': 'Tell me about your experience with ' + skill + ' (Question ' + str(i + 1) + ')'}
            fallback_questions.append(q)
        return fallback_questions

    # Parse JSON from response
    cleaned = clean_json_response(response_text)

    try:
        questions = json.loads(cleaned)
        return questions
    except json.JSONDecodeError:
        # Try to find JSON array in response
        start_index = cleaned.find('[')
        end_index = cleaned.rfind(']')

        if start_index != -1 and end_index != -1:
            json_str = cleaned[start_index:end_index + 1]
            try:
                questions = json.loads(json_str)
                return questions
            except json.JSONDecodeError:
                pass

        # Return fallback questions
        fallback_questions = []
        for i in range(count):
            q = {'question': 'Explain a key concept in ' + skill + ' (Question ' + str(i + 1) + ')'}
            fallback_questions.append(q)
        return fallback_questions


def evaluate_answer_conversational(question, answer, skill, difficulty, conversation_history=None):
    """Evaluate a candidate's answer with conversational context"""

    # Build conversation history text
    history_text = ''
    if conversation_history is not None and len(conversation_history) > 0:
        # Only use last 10 turns
        recent_history = conversation_history
        if len(conversation_history) > 10:
            recent_history = conversation_history[-10:]

        for turn in recent_history:
            role = turn.get('role', '')
            text = turn.get('text', '')
            history_text = history_text + role.upper() + ': ' + text + '\n'

    prompt = (
        'You are a professional, slightly strict technical interviewer conducting a '
        + difficulty + ' level ' + skill + ' interview.\n\n'
        'Previous conversation:\n' + history_text + '\n\n'
        'Current question: ' + question + '\n'
        'Candidate\'s answer: ' + answer + '\n\n'
        'Evaluate the answer and respond with ONLY this JSON format:\n'
        '{\n'
        '  "score": <number from 1 to 10>,\n'
        '  "feedback": "<short 1-2 sentence feedback>",\n'
        '  "verboseFeedback": "<detailed 3-5 sentence feedback paragraph>",\n'
        '  "spokenResponse": "<short 1-2 sentence spoken reaction and transition to next question>",\n'
        '  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],\n'
        '  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],\n'
        '  "confidenceTips": ["<tip 1>", "<tip 2>", "<tip 3>"]\n'
        '}\n\n'
        'IMPORTANT: Return ONLY valid JSON. No markdown, no extra text.'
    )

    response_text = call_gemini(prompt, temperature=0.6)

    if response_text is None:
        # Return fallback evaluation
        result = {
            'score': 5,
            'feedback': 'Thank you for your answer. Let me evaluate it.',
            'verboseFeedback': 'Your answer shows some understanding of the topic. Consider providing more specific examples and technical details to strengthen your response.',
            'spokenResponse': 'Thank you for that answer. Let us move on to the next question.',
            'strengths': ['Attempted the question', 'Showed basic understanding', 'Communicated clearly'],
            'improvements': ['Add more technical details', 'Provide specific examples', 'Structure your answer better'],
            'confidenceTips': ['Take a moment to organize your thoughts', 'Use the STAR method for examples', 'Practice speaking about technical concepts'],
        }
        return result

    # Parse JSON from response
    cleaned = clean_json_response(response_text)

    try:
        result = json.loads(cleaned)
        return result
    except json.JSONDecodeError:
        # Try to find JSON object in response
        start_index = cleaned.find('{')
        end_index = cleaned.rfind('}')

        if start_index != -1 and end_index != -1:
            json_str = cleaned[start_index:end_index + 1]
            try:
                result = json.loads(json_str)
                return result
            except json.JSONDecodeError:
                pass

        # Return fallback
        result = {
            'score': 5,
            'feedback': 'Your answer has been noted.',
            'verboseFeedback': 'Thank you for your response. The evaluation system encountered an issue, but your answer has been recorded.',
            'spokenResponse': 'Thank you. Let us continue to the next question.',
            'strengths': ['Answered the question', 'Showed effort', 'Communicated ideas'],
            'improvements': ['Add more depth', 'Include examples', 'Be more specific'],
            'confidenceTips': ['Practice explaining concepts', 'Use structured answers', 'Stay calm and focused'],
        }
        return result
