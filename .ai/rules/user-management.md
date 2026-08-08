---
paths:
  - '{app/Http/Controllers/{UserManagementController,UserRoleController,RegionController}.php,app/Http/Requests/Store{UserRole,Region}Request.php,resources/js/pages/user-management/**}'
---

# User Management

## Role and region directories are super-admin-only
Only Super Admin may see or access Role and Region management. Built-in roles cannot be deleted; custom roles and regions may only be deleted when no users or application records reference them. Directory search and pagination must remain server-side and use distinct query-string page names.
