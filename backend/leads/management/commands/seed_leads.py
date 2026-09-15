import csv
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.core.management.base import BaseCommand
from leads.models import Lead
from leads.services.extraction import extract_source_from_text

class Command(BaseCommand):
    help = 'Seeds database with raw leads CSV data'

    def process_row(self, row):
        first = row.get('First Name', '').strip()
        last = row.get('Last Name', '').strip()
        full = row.get('Full Name', '').strip()

        if not first and not last and full:
            parts = full.split(' ', 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else ''

        raw_status = row.get('Lead Status', '').strip().strip('"').strip("'")
        normalized_status = raw_status.title() if raw_status else 'New'

        raw_phone = row.get('Phone Number', '').strip()
        digits = re.sub(r'\D', '', raw_phone)

        raw_notes = row.get('Notes', '').strip()
        original_source = row.get('Original Source', '').strip()
        
        combined_text = f"Source: {original_source}. Notes: {raw_notes}".strip()
        extracted_source = extract_source_from_text(combined_text) if combined_text else {}

        return Lead(
            first_name=first or None,
            last_name=last or None,
            full_name=full or f"{first} {last}".strip() or None,
            email=row.get('Email', '').strip().lower() or None,
            company=row.get('Company Name', '').strip() or None,
            phone=raw_phone or None,
            normalized_phone=digits[-7:] if len(digits) >= 7 else None,
            status=normalized_status,
            owner=row.get('Contact Owner', '').strip() or None,
            country=row.get('Country/Region', '').strip() or None,
            original_source=original_source or None,
            notes=raw_notes or None,
            source_channel=extracted_source.get('channel'),
            source_detail=extracted_source.get('detail'),
        )

    def handle(self, *args, **options):
        file_path = 'data/leads_seed.csv'
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = list(csv.DictReader(f))

        total_rows = len(reader)
        self.stdout.write(f"Processing {total_rows} rows...")

        leads_to_create = []
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(self.process_row, row) for row in reader]
            
            for count, future in enumerate(as_completed(futures), 1):
                leads_to_create.append(future.result())
                if count % 100 == 0 or count == total_rows:
                    self.stdout.write(f"Processed {count}/{total_rows} leads...")


        Lead.objects.all().delete()
        Lead.objects.bulk_create(leads_to_create, batch_size=500)

        self.stdout.write(self.style.SUCCESS(f'Successfully ingested {len(leads_to_create)} leads.'))