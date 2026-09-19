import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Interview, InterviewResponse
from .services.ai_service import generate_interview_questions, evaluate_answer_conversational
from .services.email_service import send_interview_complete_email


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def api_start_interview(request):
    """API: Start a new interview session"""
    try:
        data = json.loads(request.body)
        skill = data.get('skill', '')
        difficulty = data.get('difficulty', 'medium')
        
        if skill == '':
            return JsonResponse({'success': False, 'error': 'Skill is required'}, status=400)
        
        # Generate questions using AI
        questions = generate_interview_questions(skill, difficulty, 10)
        
        # Create the interview record
        interview = Interview.objects.create(
            user=request.user,
            skill=skill,
            difficulty=difficulty,
            is_completed=False,
        )
        
        # Create question records
        for i in range(len(questions)):
            question_text = questions[i].get('question', 'Question ' + str(i + 1))
            InterviewResponse.objects.create(
                interview=interview,
                question_number=i + 1,
                question=question_text,
            )
        
        return JsonResponse({
            'success': True,
            'interviewId': interview.id,
            'questionCount': len(questions),
        })
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
def api_get_questions(request, interview_id):
    """API: Get all questions for an interview"""
    try:
        interview = Interview.objects.get(id=interview_id, user=request.user)
        responses = InterviewResponse.objects.filter(interview=interview).order_by('question_number')
        
        questions_list = []
        for response in responses:
            question_data = {
                'id': response.id,
                'questionNumber': response.question_number,
                'question': response.question,
                'userAnswer': response.user_answer,
                'aiScore': response.ai_score,
                'aiFeedback': response.ai_feedback,
            }
            questions_list.append(question_data)
        
        return JsonResponse({
            'success': True,
            'questions': questions_list,
            'interview': {
                'skill': interview.skill,
                'difficulty': interview.difficulty,
            }
        })
    
    except Interview.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Interview not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def api_converse(request, interview_id):
    """API: Submit an answer and get AI evaluation"""
    try:
        interview = Interview.objects.get(id=interview_id, user=request.user)
        data = json.loads(request.body)
        
        question_id = data.get('questionId', 0)
        answer = data.get('answer', '')
        conversation_history = data.get('conversationHistory', [])
        
        # Find the question response record
        response_record = InterviewResponse.objects.get(id=question_id, interview=interview)
        
        # Evaluate the answer using AI
        result = evaluate_answer_conversational(
            response_record.question,
            answer,
            interview.skill,
            interview.difficulty,
            conversation_history
        )
        
        # Save the evaluation to database
        response_record.user_answer = answer
        response_record.ai_score = result.get('score', 5)
        response_record.ai_feedback = result.get('feedback', '')
        
        # Save strengths, improvements, confidenceTips as JSON strings
        strengths_list = result.get('strengths', [])
        improvements_list = result.get('improvements', [])
        tips_list = result.get('confidenceTips', [])
        
        response_record.strengths = json.dumps(strengths_list)
        response_record.improvements = json.dumps(improvements_list)
        response_record.confidence_tips = json.dumps(tips_list)
        response_record.save()
        
        return JsonResponse({
            'success': True,
            'score': result.get('score', 5),
            'feedback': result.get('feedback', ''),
            'verboseFeedback': result.get('verboseFeedback', ''),
            'spokenResponse': result.get('spokenResponse', ''),
            'strengths': strengths_list,
            'improvements': improvements_list,
            'confidenceTips': tips_list,
        })
    
    except Interview.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Interview not found'}, status=404)
    except InterviewResponse.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Question not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def api_complete_interview(request, interview_id):
    """API: Mark interview as complete and calculate scores"""
    try:
        interview = Interview.objects.get(id=interview_id, user=request.user)
        
        # Get all responses
        responses = InterviewResponse.objects.filter(interview=interview)
        
        # Calculate total and average scores
        total_score = 0
        answered_count = 0
        
        for response in responses:
            if response.ai_score is not None:
                total_score = total_score + response.ai_score
                answered_count = answered_count + 1
        
        # Calculate average
        avg_score = 0
        if answered_count > 0:
            avg_score = round(total_score / answered_count, 2)
        
        # Get duration from request body
        try:
            data = json.loads(request.body)
            duration = data.get('duration', 0)
        except:
            duration = 0
        
        # Update interview record
        interview.is_completed = True
        interview.total_score = total_score
        interview.avg_score = avg_score
        interview.questions_attempted = answered_count
        interview.interview_duration = duration
        interview.save()
        
        # Send completion email
        user_name = request.user.first_name
        if user_name == '':
            user_name = request.user.username
        
        email_data = {
            'skill': interview.skill,
            'total_score': total_score,
            'avg_score': avg_score,
            'questions_attempted': answered_count,
            'report_url': '/reports/' + str(interview.id) + '/',
        }
        
        send_interview_complete_email(request.user.email, user_name, email_data)
        
        return JsonResponse({
            'success': True,
            'totalScore': total_score,
            'avgScore': str(avg_score),
        })
    
    except Interview.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Interview not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET", "DELETE"])
def api_list_interviews(request):
    """API: List user's interviews (GET) or delete an interview (DELETE)"""
    if request.method == 'GET':
        try:
            interviews = Interview.objects.filter(user=request.user).order_by('-created_at')[:10]
            
            interviews_list = []
            for interview in interviews:
                interview_data = {
                    'id': interview.id,
                    'skill': interview.skill,
                    'difficulty': interview.difficulty,
                    'totalScore': interview.total_score,
                    'avgScore': str(interview.avg_score),
                    'questionsAttempted': interview.questions_attempted,
                    'interviewDuration': interview.interview_duration,
                    'isCompleted': interview.is_completed,
                    'createdAt': interview.created_at.strftime('%Y-%m-%d %H:%M'),
                }
                interviews_list.append(interview_data)
            
            # Calculate stats
            completed = Interview.objects.filter(user=request.user, is_completed=True)
            total_completed = 0
            total_avg = 0
            total_time = 0
            
            for c in completed:
                total_completed = total_completed + 1
                total_avg = total_avg + float(c.avg_score)
                total_time = total_time + c.interview_duration
            
            overall_avg = 0
            if total_completed > 0:
                overall_avg = round(total_avg / total_completed, 2)
            
            return JsonResponse({
                'success': True,
                'interviews': interviews_list,
                'stats': {
                    'total': total_completed,
                    'avgScore': overall_avg,
                    'totalTime': total_time,
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    elif request.method == 'DELETE':
        try:
            # Get interview ID from query params
            interview_id = request.GET.get('id', '')
            
            if interview_id == '':
                return JsonResponse({'success': False, 'error': 'Interview ID required'}, status=400)
            
            interview = Interview.objects.get(id=int(interview_id), user=request.user)
            
            # Delete responses first, then interview
            InterviewResponse.objects.filter(interview=interview).delete()
            interview.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Interview deleted successfully'
            })
        except Interview.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Interview not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
