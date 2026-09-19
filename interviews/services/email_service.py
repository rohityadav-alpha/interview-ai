import os
from django.conf import settings


def send_interview_complete_email(user_email, user_name, interview_data):
    """Send email when interview is completed"""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        api_key = settings.SENDGRID_API_KEY
        if not api_key or api_key == '':
            print('SendGrid API key not configured, skipping email')
            return False
        
        from_email = settings.SENDGRID_FROM_EMAIL
        from_name = settings.SENDGRID_FROM_NAME
        
        # Build the email HTML
        skill = interview_data.get('skill', 'General')
        total_score = interview_data.get('total_score', 0)
        avg_score = interview_data.get('avg_score', 0)
        questions_attempted = interview_data.get('questions_attempted', 0)
        report_url = interview_data.get('report_url', '#')
        
        html_content = '<html><body>'
        html_content = html_content + '<h1>Interview Complete!</h1>'
        html_content = html_content + '<p>Hi ' + str(user_name) + ',</p>'
        html_content = html_content + '<p>Your <strong>' + str(skill) + '</strong> interview has been completed.</p>'
        html_content = html_content + '<h2>Results Summary</h2>'
        html_content = html_content + '<ul>'
        html_content = html_content + '<li>Total Score: ' + str(total_score) + '</li>'
        html_content = html_content + '<li>Average Score: ' + str(avg_score) + '</li>'
        html_content = html_content + '<li>Questions Attempted: ' + str(questions_attempted) + '</li>'
        html_content = html_content + '</ul>'
        html_content = html_content + '<p><a href="' + str(report_url) + '">View Full Report</a></p>'
        html_content = html_content + '<p>Keep practicing! - Interview AI Team</p>'
        html_content = html_content + '</body></html>'
        
        message = Mail(
            from_email=(from_email, from_name),
            to_emails=user_email,
            subject='Interview Complete - ' + str(skill) + ' | Interview AI',
            html_content=html_content
        )
        
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        if response.status_code == 202:
            return True
        else:
            print('SendGrid returned status: ' + str(response.status_code))
            return False
    
    except Exception as e:
        print('Error sending email: ' + str(e))
        return False
