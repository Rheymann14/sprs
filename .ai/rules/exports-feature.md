---
paths:
  - '{app/Http/Controllers/RawIncidentController.php,app/Http/Requests/RawIncidentIndexRequest.php,resources/js/pages/raw-list/**,resources/views/exports/raw-incidents.blade.php,tests/Feature/RawIncidentListTest.php}'
---

# Exports Feature

## Raw List uses inline answers and formatted Excel export
Supersedes the earlier details-page behavior: show saved report_data answers compactly in each Raw List table row with no View action or separate details route. Sorting and Excel export must preserve the validated date/type/subcategory filters and regional access; the Excel workbook uses bordered cells, a blue header, and AutoFilter.
