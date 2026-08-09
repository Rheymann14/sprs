---
paths:
  - '{app/Models/{IncidentType,IncidentSubcategory}.php,app/Http/Controllers/{FormManagement,IncidentType,IncidentSubcategory,IncidentForm,IncidentStatus}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/form-management/**,database/migrations/**}'
---

# Form Management Migrations

## Incident type and subcategory configuration is region-owned
Every incident type and subcategory belongs to one region. Form Management must query and mutate only the effective region (the authenticated region, or the region selected by Super Admin). CHED Central Office therefore sees only Central Office-configured types and subcategories. Forms and status definitions must belong to a subcategory from the same effective region.
