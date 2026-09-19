from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Interview, InterviewResponse


@login_required
def dashboard_view(request):
    """User dashboard showing interview history and stats"""
    # Get user's interviews (most recent first)
    interviews = Interview.objects.filter(user=request.user).order_by('-created_at')[:10]
    
    # Calculate stats for completed interviews
    completed_interviews = Interview.objects.filter(user=request.user, is_completed=True)
    
    total_completed = 0
    total_avg_score = 0
    total_time = 0
    
    for interview in completed_interviews:
        total_completed = total_completed + 1
        total_avg_score = total_avg_score + float(interview.avg_score)
        total_time = total_time + interview.interview_duration
    
    # Calculate overall average
    overall_avg = 0
    if total_completed > 0:
        overall_avg = round(total_avg_score / total_completed, 2)
    
    # Convert time to minutes
    total_minutes = round(total_time / 60, 1)
    
    # Prepare chart data for performance over time
    chart_data = []
    for interview in completed_interviews.order_by('created_at'):
        chart_data.append({
            'date': interview.created_at.strftime('%Y-%m-%d'),
            'score': float(interview.avg_score),
            'skill': interview.skill,
        })
    
    context = {
        'interviews': interviews,
        'stats': {
            'total': total_completed,
            'avg_score': overall_avg,
            'total_time': total_minutes,
        },
        'chart_data': chart_data,
    }
    
    return render(request, 'interviews/dashboard.html', context)


@login_required
def new_interview_view(request):
    """Page to start a new interview - select skill and difficulty"""
    skill_options = [
        'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
        'Python', 'Java', 'C++', 'SQL', 'MongoDB',
        'System Design', 'DSA', 'Algorithms',
    ]
    
    context = {
        'skill_options': skill_options,
    }
    
    return render(request, 'interviews/new_interview.html', context)


@login_required
def live_interview_view(request, interview_id):
    """Live interview session page"""
    interview = get_object_or_404(Interview, id=interview_id, user=request.user)
    
    # If already completed, redirect to report
    if interview.is_completed:
        return redirect('report_detail', interview_id=interview.id)
    
    context = {
        'interview': interview,
    }
    
    return render(request, 'interviews/live_interview.html', context)
