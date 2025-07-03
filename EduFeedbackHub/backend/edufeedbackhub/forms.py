from django import forms
from .models import Comment

# Comment form using Django ModelForm
class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment  # This form is based on the Comment model
        fields = ['content']  # The form will only include the 'content' field from the model

        widgets = {
            'content': forms.Textarea(attrs={'rows': 2, 'placeholder': 'Leave a comment...'}),
            # Use a textarea widget for the 'content' field
            # It will have 2 rows height and a placeholder text "Leave a comment..."
        }

        labels = {
            'content': '',
            # Hide the label for the 'content' field (no field name displayed)
        }

