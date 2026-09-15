import csv
import re
from django.http import HttpResponse
from django.db.models import Count
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Lead
from .serializers import LeadSerializer
from .services.extraction import extract_source_from_text
from .services.deduplication import generate_dedupe_candidates, merge_leads


class LeadSearchFilter(filters.SearchFilter):
    search_param = 'q'

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by('-created_at')
    serializer_class = LeadSerializer
    filter_backends = [DjangoFilterBackend, LeadSearchFilter]
    filterset_fields = ['status', 'owner', 'country']
    search_fields = ['first_name', 'last_name', 'full_name', 'company', 'email']

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Email', 'Company', 'Status', 'Owner', 'Country', 'Source Channel'])
        
        for lead in queryset:
            writer.writerow([
                lead.id, str(lead), lead.email or '', lead.company or '',
                lead.status or '', lead.owner or '', lead.country or '', lead.source_channel or ''
            ])
        return response

    @action(detail=False, methods=['post'])
    def ingest(self, request):
        payload = request.data
        email = payload.get('email', '').strip().lower()
        phone = payload.get('phone', '').strip()
        
        raw_name = payload.get('name', '').strip()
        first_name = payload.get('first_name', '').strip()
        last_name = payload.get('last_name', '').strip()

        if raw_name and not (first_name or last_name):
            parts = raw_name.split(' ', 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''

        message = payload.get('message') or payload.get('notes', '')
        form_name = payload.get('form_name', '')
        page_url = payload.get('page_url', '')
        form_id = payload.get('form_id', '')

        combined_source_text = f"Form: {form_name}. Page: {page_url}. Message: {message}".strip()
        extracted_source = extract_source_from_text(combined_source_text) if combined_source_text else {}

        form_note_entry = f"--- Form Submission ({form_name or 'Web Form'}) ---\n"
        if page_url:
            form_note_entry += f"Page: {page_url}\n"
        if message:
            form_note_entry += f"Message: {message}\n"

        existing_lead = None
        if email:
            existing_lead = Lead.objects.filter(email__iexact=email).first()
        if not existing_lead and phone:
            digits = re.sub(r'\D', '', phone)[-7:]
            if digits:
                existing_lead = Lead.objects.filter(normalized_phone=digits).first()

        if existing_lead:
            if not existing_lead.company and payload.get('company'):
                existing_lead.company = payload.get('company')
            if not existing_lead.country and payload.get('country'):
                existing_lead.country = payload.get('country')
            if not existing_lead.phone and phone:
                existing_lead.phone = phone
            if not existing_lead.email and email:
                existing_lead.email = email

            existing_lead.notes = f"{existing_lead.notes or ''}\n\n{form_note_entry}".strip()

            if payload.get('status'):
                existing_lead.status = payload.get('status')

            if extracted_source.get('channel'):
                existing_lead.source_channel = extracted_source.get('channel')
                existing_lead.source_detail = extracted_source.get('detail')

            existing_lead.save()
            return Response({"status": "updated", "lead": self.get_serializer(existing_lead).data})

        else:
            new_lead = Lead.objects.create(
                first_name=first_name,
                last_name=last_name,
                full_name=raw_name,
                email=email or None,
                phone=phone or None,
                company=payload.get('company'),
                country=payload.get('country'),
                status=payload.get('status', 'New'),
                original_source=f"{form_name} ({page_url})" if form_name else page_url or "Website Form",
                notes=form_note_entry.strip(),
                source_channel=extracted_source.get('channel'),
                source_detail=extracted_source.get('detail')
            )
            return Response({"status": "created", "lead": self.get_serializer(new_lead).data}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='dedupe-candidates')
    def dedupe_candidates(self, request):
        threshold = request.data.get('threshold', 0.6)
        limit = request.data.get('limit', 20)

        candidates = generate_dedupe_candidates(
            confidence_threshold=float(threshold),
            limit=int(limit)
        )
        return Response({"candidate_pairs": candidates, "total_pairs": len(candidates)}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='merge')
    def merge(self, request):
        """
        Merges two leads into one primary lead.
        Request body: { "primary_id": 12, "secondary_id": 15 }
        """
        primary_id = request.data.get('primary_id')
        secondary_id = request.data.get('secondary_id')

        if not primary_id or not secondary_id:
            return Response({"error": "Both primary_id and secondary_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            merged_lead = merge_leads(primary_id, secondary_id)
            return Response({
                "message": "Leads merged successfully.",
                "lead": LeadSerializer(merged_lead).data
            }, status=status.HTTP_200_OK)
        except Lead.DoesNotExist:
            return Response({"error": "One or both leads were not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        status_counts = Lead.objects.values('status').annotate(count=Count('id')).order_by('-count')
        channel_counts = Lead.objects.values('source_channel').annotate(count=Count('id')).order_by('-count')
        
        return Response({
            "total_leads": Lead.objects.count(),
            "by_status": list(status_counts),
            "by_source_channel": list(channel_counts)
        })