---
paths:
  - '{app/Exports/RawIncidentWorkbook.php,app/Http/Controllers/RawIncidentController.php,tests/Feature/RawIncidentListTest.php}'
---

# Controllers Feature

## Raw List exports genuine XLSX workbooks
Raw List exports must be generated as Office Open XML .xlsx files through PhpSpreadsheet, not SpreadsheetML .xls. Preserve the blue header, thin cell borders, frozen header row, AutoFilter range, wrapped form answers, validated filters, access scope, and selected sort order.
