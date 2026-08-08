---
paths:
  - '{app/Http/Controllers/IncidentController.php,app/Http/Requests/UpdateIncidentRequest.php,resources/js/pages/incidents/**}'
---

# Pages Incidents

## Incident actions are region-scoped
Users may update or delete only incidents in their own region. Status edits must use the incident subcategory's configured statuses, and deleting an incident also removes any locally stored report attachments after confirmation.

## Incident edits use the report page
The incidents-table Edit action navigates to incidents/report/{incident} and reuses the full report page with saved answers prefilled. Keep incident type and subcategory locked during edits; allow validated report details, attachments, and configured status to change.

## Report edits preserve incident status
Supersedes the earlier edit-page status behavior: the incident report edit page must not show or accept a status field. Editing updates report details and attachments only, while preserving the incident's existing configured status.
