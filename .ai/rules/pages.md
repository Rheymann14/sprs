---
paths:
  - '{app/Http/Controllers/StatisticsController.php,resources/js/pages/statistics.tsx}'
  - '{app/Http/Controllers/{Statistics,Incident}Controller.php,resources/js/pages/{statistics.tsx,incidents/index.tsx}}'
---

# Pages

## Statistics are regional and report-grouped
Statistics must include only incidents in the authenticated user's region. Group saved incident reports by created year, incident type, and subcategory, and derive displayed status counts from each subcategory's configured Manage Status definitions (falling back to the standard defaults when none exist).

## Statistics count cards filter incidents
Every statistics Total Incident Count card links to the incidents index filtered by its year, incident type ID, and subcategory ID. Managed-status count cards add the clicked status; the incidents page must show and preserve these filters through search and pagination.
