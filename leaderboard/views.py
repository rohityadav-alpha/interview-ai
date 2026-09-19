from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from interviews.models import Interview


def leaderboard_view(request):
    """Render leaderboard page"""
    return render(request, 'leaderboard/leaderboard.html')


@require_http_methods(["GET"])
def api_leaderboard(request):
    """API: Get leaderboard data"""
    try:
        skill_filter = request.GET.get('skill', 'all')
        
        # Get all completed interviews with scores
        if skill_filter == 'all' or skill_filter == '':
            interviews = Interview.objects.filter(
                is_completed=True,
                total_score__gt=0
            ).select_related('user')
        else:
            interviews = Interview.objects.filter(
                is_completed=True,
                total_score__gt=0,
                skill=skill_filter
            ).select_related('user')
        
        # Deduplicate by user email - keep best score for each user
        best_scores = {}
        interview_counts = {}
        
        for interview in interviews:
            email = interview.user.email
            
            # Count interviews per user
            if email not in interview_counts:
                interview_counts[email] = 0
            interview_counts[email] = interview_counts[email] + 1
            
            # Keep the best score
            if email not in best_scores:
                best_scores[email] = interview
            else:
                current_best = best_scores[email]
                if interview.total_score > current_best.total_score:
                    best_scores[email] = interview
                elif interview.total_score == current_best.total_score:
                    if float(interview.avg_score) > float(current_best.avg_score):
                        best_scores[email] = interview
        
        # Convert to list for sorting
        sorted_list = []
        for email in best_scores:
            sorted_list.append(best_scores[email])
        
        # Sort by total_score descending (simple bubble sort)
        for i in range(len(sorted_list)):
            for j in range(i + 1, len(sorted_list)):
                if sorted_list[j].total_score > sorted_list[i].total_score:
                    temp = sorted_list[i]
                    sorted_list[i] = sorted_list[j]
                    sorted_list[j] = temp
        
        # Take top 100 and build response
        top_100 = sorted_list[:100]
        
        leaderboard_data = []
        for rank_index in range(len(top_100)):
            entry = top_100[rank_index]
            user = entry.user
            
            # Build user display name
            user_name = ''
            if user.first_name != '':
                user_name = user.first_name
            if user.last_name != '':
                user_name = user_name + ' ' + user.last_name
            if user_name == '' or user_name == ' ':
                user_name = user.username
            user_name = user_name.strip()
            
            leaderboard_entry = {
                'rank': rank_index + 1,
                'userEmail': user.email,
                'userName': user_name,
                'skill': entry.skill,
                'difficulty': entry.difficulty,
                'totalScore': entry.total_score,
                'avgScore': str(entry.avg_score),
                'interviewCount': interview_counts.get(user.email, 0),
                'createdAt': entry.created_at.strftime('%Y-%m-%d'),
            }
            leaderboard_data.append(leaderboard_entry)
        
        return JsonResponse({'leaderboard': leaderboard_data})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def api_leaderboard_skills(request):
    """API: Get list of distinct skills from completed interviews"""
    try:
        completed = Interview.objects.filter(is_completed=True)
        
        # Get unique skills
        skills_set = set()
        for interview in completed:
            skills_set.add(interview.skill)
        
        # Convert to sorted list
        skills_list = list(skills_set)
        skills_list.sort()
        
        return JsonResponse({'skills': skills_list})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
