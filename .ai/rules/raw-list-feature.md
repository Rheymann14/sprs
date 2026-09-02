---
paths:
  - '{app/Http/Controllers/RawIncidentController.php,resources/js/pages/raw-list/**,tests/Feature/RawIncidentListTest.php}'
---

# Raw List Feature

## Raw List mirrors incident access and saved snapshots
Raw List must show only incidents accessible through origin-region, routed-region, or Super Admin access. Its details page renders the historical form structure and answers from incidents.report_data, so later form edits do not change submitted answers.
