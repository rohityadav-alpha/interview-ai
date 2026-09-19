from django import forms


SKILL_CHOICES = [
    ('JavaScript', 'JavaScript'),
    ('TypeScript', 'TypeScript'),
    ('React', 'React'),
    ('Next.js', 'Next.js'),
    ('Node.js', 'Node.js'),
    ('Python', 'Python'),
    ('Java', 'Java'),
    ('C++', 'C++'),
    ('SQL', 'SQL'),
    ('MongoDB', 'MongoDB'),
    ('System Design', 'System Design'),
    ('DSA', 'DSA'),
    ('Algorithms', 'Algorithms'),
]

DIFFICULTY_CHOICES = [
    ('easy', 'Easy'),
    ('medium', 'Medium'),
    ('hard', 'Hard'),
]


class NewInterviewForm(forms.Form):
    """Form for starting a new interview"""
    skill = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'Enter skill or select from below',
        })
    )
    difficulty = forms.ChoiceField(
        choices=DIFFICULTY_CHOICES,
        initial='medium',
        widget=forms.RadioSelect(attrs={
            'class': 'difficulty-radio',
        })
    )
