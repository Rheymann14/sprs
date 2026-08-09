---
paths:
  - '{app/Http/Controllers/{Statistics,Incident,FormManagement,IncidentForm}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/{statistics.tsx,incidents/**,form-management/**}}'
---

# Requests Js Pages

## Super Admin regional filters
Super Admin may read and manage incidents across all regions and filter statistics/incidents by region. Form Management always targets one explicit effective region (defaulting to the assigned region) and Super Admin may switch it. Non-super administrators remain strictly scoped to their assigned region.
