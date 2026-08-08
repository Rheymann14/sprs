---
paths:
  - '{app/Http/Controllers/{Incident,IncidentStatus}Controller.php,resources/js/pages/incidents/**}'
---

# Incidents

## Configured statuses drive incident badges
Incident status labels and badge colors come from the selected subcategory's Manage Status definitions. The circle-check, clock, and circle-alert icons consistently map to green, orange, and red; new reports start on the configured clock status (or the first configured status), and status renames migrate existing incidents.
