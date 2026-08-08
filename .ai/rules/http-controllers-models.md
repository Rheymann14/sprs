---
paths:
  - '{app/Http/Controllers/IncidentController.php,app/Models/Incident.php}'
---

# Http Controllers Models

## Incident reports retain form snapshots
When an incident report is submitted, persist a historical snapshot of the selected region-owned form structure and its validated answers in incidents.report_data. Later form-management edits must not alter existing report contents.
