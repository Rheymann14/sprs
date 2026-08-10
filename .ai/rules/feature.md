---
paths:
  - '{app/Http/Controllers/IncidentController.php,resources/js/pages/incidents/show.tsx,tests/Feature/IncidentTest.php}'
---

# Feature

## Incident file index stays complete and lightweight
The incident show page exposes all conversation attachment metadata through a deferred prop independent of the bounded message history. Group files by message sender and timestamp, render only four files initially with an explicit show-more control, and lazy-load image content/full previews.
