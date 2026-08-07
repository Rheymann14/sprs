---
paths:
  - '{app/Models/UserRole.php,app/Http/Controllers/UserManagementController.php,resources/js/pages/user-management/**}'
---

# Pages User Management

## User management roles and access
Assignable roles are grouped as CHED Central Office (Super Admin, CO Administrator, CO Staff), CHED Regional Office (RO Administrator, RO Staff), and Agency. User management is limited to legacy administrators, Super Admin, and CO Administrator; role slugs and labels come from UserRole::assignmentGroups().
