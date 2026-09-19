import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from interviews.models import Interview, InterviewResponse


@login_required
def report_detail_view(request, interview_id):
    """Render interview report page"""
    interview = get_object_or_404(Interview, id=interview_id, user=request.user)
    
    responses = InterviewResponse.objects.filter(interview=interview).order_by('question_number')
    
    # Parse JSON strings for strengths, improvements, tips
    processed_responses = []
    for response in responses:
        response_data = {
            'question_number': response.question_number,
            'question': response.question,
            'user_answer': response.user_answer,
            'ai_score': response.ai_score,
            'ai_feedback': response.ai_feedback,
            'strengths': [],
            'improvements': [],
            'confidence_tips': [],
        }
        
        # Parse strengths
        if response.strengths and response.strengths != '':
            try:
                response_data['strengths'] = json.loads(response.strengths)
            except:
                response_data['strengths'] = [response.strengths]
        
        # Parse improvements
        if response.improvements and response.improvements != '':
            try:
                response_data['improvements'] = json.loads(response.improvements)
            except:
                response_data['improvements'] = [response.improvements]
        
        # Parse confidence tips
        if response.confidence_tips and response.confidence_tips != '':
            try:
                response_data['confidence_tips'] = json.loads(response.confidence_tips)
            except:
                response_data['confidence_tips'] = [response.confidence_tips]
        
        processed_responses.append(response_data)
    
    # Determine performance grade
    avg = float(interview.avg_score)
    grade = 'Keep Practicing'
    grade_color = 'red'
    if avg >= 8.5:
        grade = 'Outstanding'
        grade_color = 'gold'
    elif avg >= 7:
        grade = 'Great Job'
        grade_color = 'green'
    elif avg >= 5:
        grade = 'Good Effort'
        grade_color = 'blue'
    
    # Build structured data dictionary for PDF export and client rendering
    candidate_name = request.user.get_full_name()
    if not candidate_name:
        candidate_name = request.user.username
        
    report_summary = {
        'id': interview.id,
        'candidate_name': candidate_name,
        'candidate_email': request.user.email,
        'skill': interview.skill,
        'difficulty': interview.difficulty,
        'total_score': interview.total_score,
        'avg_score': str(interview.avg_score),
        'questions_attempted': interview.questions_attempted,
        'duration': interview.interview_duration,
        'grade': grade,
        'grade_color': grade_color,
        'created_at': interview.created_at.strftime('%B %d, %Y - %H:%M'),
        'responses': processed_responses,
    }
    
    context = {
        'interview': interview,
        'responses': processed_responses,
        'grade': grade,
        'grade_color': grade_color,
        'report_json': json.dumps(report_summary),
    }
    
    return render(request, 'reports/report_detail.html', context)


@login_required
@require_http_methods(["GET"])
def api_report_detail(request, interview_id):
    """API: Get interview report data as JSON"""
    try:
        interview = Interview.objects.get(id=interview_id, user=request.user)
        responses = InterviewResponse.objects.filter(interview=interview).order_by('question_number')
        
        responses_list = []
        for response in responses:
            # Parse JSON fields
            strengths = []
            improvements = []
            tips = []
            
            if response.strengths and response.strengths != '':
                try:
                    strengths = json.loads(response.strengths)
                except:
                    strengths = [response.strengths]
            
            if response.improvements and response.improvements != '':
                try:
                    improvements = json.loads(response.improvements)
                except:
                    improvements = [response.improvements]
            
            if response.confidence_tips and response.confidence_tips != '':
                try:
                    tips = json.loads(response.confidence_tips)
                except:
                    tips = [response.confidence_tips]
            
            response_data = {
                'id': response.id,
                'questionNumber': response.question_number,
                'question': response.question,
                'userAnswer': response.user_answer,
                'aiScore': response.ai_score,
                'aiFeedback': response.ai_feedback,
                'strengths': strengths,
                'improvements': improvements,
                'confidenceTips': tips,
                'timeTaken': response.time_taken,
            }
            responses_list.append(response_data)
        
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
            'responses': responses_list,
        }
        
        return JsonResponse({
            'success': True,
            'interview': interview_data,
        })
    
    except Interview.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Interview not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
