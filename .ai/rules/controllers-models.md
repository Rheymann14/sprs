---
paths:
  - '{app/Http/Controllers/FormManagementController.php,app/Http/Controllers/IncidentFormController.php,app/Models/IncidentForm.php}'
---

# Controllers Models

## Incident forms are region-owned
Saved incident forms are scoped to the authenticated user's region. A subcategory may have one form per region; region-scoped reads and writes must never expose or overwrite another region's form.
