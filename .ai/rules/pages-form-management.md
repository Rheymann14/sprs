---
paths:
  - '{app/Models/IncidentStatus.php,app/Http/Controllers/IncidentStatusController.php,app/Http/Requests/UpdateIncidentStatusesRequest.php,resources/js/pages/form-management/**}'
---

# Pages Form Management

## Incident statuses are subcategory-owned
Status definitions belong to an incident subcategory (with its incident type as the scoped route parent). Show Resolved, Pending, and Unresolved with their default icons when none are saved, and allow one to three configured statuses.
