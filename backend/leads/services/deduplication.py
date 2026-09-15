
from collections import defaultdict
from django.db import transaction
from rapidfuzz import fuzz
from leads.models import Lead

GENERIC_DOMAINS = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'}

def get_lead_name(lead) -> str:
    """Safely extracts full name with fallback to full_name field."""
    if getattr(lead, 'full_name', None):
        return lead.full_name.strip()
    return f"{lead.first_name or ''} {lead.last_name or ''}".strip()


def generate_dedupe_candidates(confidence_threshold=0.6, limit=20):
    all_leads = list(Lead.objects.all())
    candidate_pairs = set()

    phone_buckets = defaultdict(list)
    domain_buckets = defaultdict(list)

    # 1. Blocking Stage (Sub O(N^2) filtering)
    for lead in all_leads:
        if lead.normalized_phone and len(lead.normalized_phone) >= 7:
            phone_buckets[lead.normalized_phone].append(lead)
        if lead.email and '@' in lead.email:
            domain = lead.email.split('@')[-1].lower().strip()
            if domain and domain not in GENERIC_DOMAINS:
                domain_buckets[domain].append(lead)

    # Add candidates matching exact phone digits
    for group in phone_buckets.values():
        if len(group) > 1:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    pair = (group[i], group[j]) if group[i].id < group[j].id else (group[j], group[i])
                    candidate_pairs.add(pair)

    # Add candidates matching non-generic domains AND high name similarity
    for group in domain_buckets.values():
        if len(group) > 1:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    name_a = get_lead_name(group[i])
                    name_b = get_lead_name(group[j])
                    
                    if name_a and name_b and fuzz.token_sort_ratio(name_a, name_b) > 75:
                        pair = (group[i], group[j]) if group[i].id < group[j].id else (group[j], group[i])
                        candidate_pairs.add(pair)

    # 2. Scoring Stage
    results = []
    
    for lead_a, lead_b in candidate_pairs:
        name_a = get_lead_name(lead_a)
        name_b = get_lead_name(lead_b)

        email_a = (lead_a.email or "").lower().strip()
        email_b = (lead_b.email or "").lower().strip()

        comp_a = (lead_a.company or "").lower().strip()
        comp_b = (lead_b.company or "").lower().strip()

        # Compute metric ratios
        name_sim = fuzz.token_sort_ratio(name_a, name_b) if (name_a and name_b) else 0.0
        email_sim = fuzz.ratio(email_a, email_b) if (email_a and email_b) else 0.0
        company_sim = fuzz.token_set_ratio(comp_a, comp_b) if (comp_a and comp_b) else 0.0
        
        # Weighted score: Name (40%), Email (40%), Company (20%)
        raw_score = (name_sim * 0.4) + (email_sim * 0.4) + (company_sim * 0.2)
        score = round(raw_score / 100.0, 2)

        reasons = []
        if name_sim >= 75:
            reasons.append(f"Name ({round(name_sim)}%)")
        if email_sim >= 70:
            reasons.append(f"Email ({round(email_sim)}%)")
        if company_sim >= 80:
            reasons.append(f"Company ({round(company_sim)}%)")

        # LAST NAME PENALTY
        if lead_a.last_name and lead_b.last_name:
            last_a = lead_a.last_name.strip().lower()
            last_b = lead_b.last_name.strip().lower()
            last_name_sim = fuzz.ratio(last_a, last_b)
            
            if last_name_sim < 60 and len(last_a) > 1 and len(last_b) > 1:
                score = min(score, 0.40)
                reasons.append("Last name mismatch penalty")

        # PHONE MATCH BONUS
        if lead_a.normalized_phone and lead_b.normalized_phone and lead_a.normalized_phone == lead_b.normalized_phone:
            score = min(1.0, round(score + 0.3, 2))
            reasons.append("Phone match bonus (+0.3)")

        if score >= confidence_threshold:
            results.append({
                "lead_a": {
                    "id": lead_a.id,
                    "first_name": lead_a.first_name,
                    "last_name": lead_a.last_name,
                    "name": name_a or str(lead_a),
                    "email": lead_a.email,
                    "company": lead_a.company,
                    "phone": lead_a.phone or lead_a.normalized_phone,
                    "owner": getattr(lead_a, 'owner', ''),
                    "status": getattr(lead_a, 'status', ''),
                    "country": getattr(lead_a, 'country', '')
                },
                "lead_b": {
                    "id": lead_b.id,
                    "first_name": lead_b.first_name,
                    "last_name": lead_b.last_name,
                    "name": name_b or str(lead_b),
                    "email": lead_b.email,
                    "company": lead_b.company,
                    "phone": lead_b.phone or lead_b.normalized_phone,
                    "owner": getattr(lead_b, 'owner', ''),
                    "status": getattr(lead_b, 'status', ''),
                    "country": getattr(lead_b, 'country', '')
                },
                "confidence_score": score,
                "reasoning": "; ".join(reasons) if reasons else f"Name: {round(name_sim)}%, Email: {round(email_sim)}%, Company: {round(company_sim)}%"
            })

    results.sort(key=lambda x: x["confidence_score"], reverse=True)
    return results[:limit]


@transaction.atomic
def merge_leads(primary_id, secondary_id):
    """
    Merges secondary lead into primary lead. Missing attributes in primary 
    are populated from secondary before deleting secondary.
    """
    if str(primary_id) == str(secondary_id):
        raise ValueError("Cannot merge a lead into itself.")

    primary = Lead.objects.get(id=primary_id)
    secondary = Lead.objects.get(id=secondary_id)

    # Attributes to backfill if primary is empty/null
    fields_to_check = [
        'email', 
        'phone', 
        'normalized_phone', 
        'company', 
        'status', 
        'owner', 
        'country', 
        'source_channel', 
        'source_detail'
    ]
    
    for field in fields_to_check:
        primary_val = getattr(primary, field, None)
        secondary_val = getattr(secondary, field, None)
        if not primary_val and secondary_val:
            setattr(primary, field, secondary_val)

    # Concatenate historical notes so secondary notes are not lost
    if secondary.notes:
        sec_note = f"--- Merged Notes (From Lead #{secondary.id}) ---\n{secondary.notes}"
        primary.notes = f"{primary.notes}\n\n{sec_note}".strip() if primary.notes else sec_note

    # Save updated primary lead and delete duplicate secondary
    primary.save()
    secondary.delete()
    
    return primary