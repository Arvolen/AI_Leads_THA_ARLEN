from django.test import TestCase
from rest_framework.test import APIClient
from leads.models import Lead
from leads.services.extraction import extract_source_from_text

class LeadBackendTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.lead1 = Lead.objects.create(
            first_name="Alex", last_name="Tan", email="alex@acme.com",
            phone="+60123456789", company="Acme Corp", status="New"
        )

    def test_phone_normalization(self):
        self.assertEqual(self.lead1.normalized_phone, "3456789")

    def test_ingest_updates_existing_lead(self):
        payload = {
            "first_name": "Alexander",
            "last_name": "Tan",
            "email": "alex@acme.com",
            "notes": "Booked demo through website form"
        }
        res = self.client.post('/api/leads/ingest/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['status'], 'updated')

    def test_ai_source_extraction_fast_path(self):
        result = extract_source_from_text("Met at SFF booth and scanned QR code")
        self.assertEqual(result['channel'], 'Event')