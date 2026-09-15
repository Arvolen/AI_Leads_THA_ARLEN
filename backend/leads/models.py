import re
from django.db import models

class Lead(models.Model):
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    email_domain = models.CharField(max_length=150, blank=True, null=True, db_index=True)
    company = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    
    phone = models.CharField(max_length=100, blank=True, null=True)
    normalized_phone = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    
    status = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    owner = models.CharField(max_length=150, blank=True, null=True, db_index=True)
    country = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    original_source = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    source_channel = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    source_detail = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):

        if self.phone:
            digits = re.sub(r'\D', '', self.phone)
            self.normalized_phone = digits[-7:] if len(digits) >= 7 else digits
        
        if self.email and '@' in self.email:
            self.email_domain = self.email.split('@')[-1].lower().strip()
            
        super().save(*args, **kwargs)

    def __str__(self):
        name = f"{self.first_name or ''} {self.last_name or ''}".strip() or self.full_name or "Unnamed"
        return f"{name} ({self.company or 'No Company'})"