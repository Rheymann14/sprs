---
paths:
  - '{app/Http/Controllers/{Incident,IncidentStatus}Controller.php,resources/js/pages/incidents/**}'
  - '{app/Http/Controllers/IncidentController.php,resources/js/pages/incidents/show.tsx}'
---

# Incidents

## Configured statuses drive incident badges
Incident status labels and badge colors come from the selected subcategory's Manage Status definitions. The circle-check, clock, and circle-alert icons consistently map to green, orange, and red; new reports start on the configured clock status (or the first configured status), and status renames migrate existing incidents.

## Incident conversations load bounded history
Keep the incident viewer lightweight by loading the latest 30 conversation messages initially. Load earlier history through partial Inertia reloads in 30-message increments, capped at 150; lazy-load saved image thumbnails and keep selected-file previews thumbnail-sized in memory.
