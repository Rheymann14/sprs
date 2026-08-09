---
paths:
  - '{app/Http/Controllers/{UserManagementController,UserRoleController,RegionController}.php,app/Http/Requests/Store{UserRole,Region}Request.php,resources/js/pages/user-management/**}'
  - '{app/Http/Controllers/{UserManagement,UserRole,Region}Controller.php,app/Http/Requests/{Store,Update}User*Request.php,resources/js/pages/user-management/**}'
---

# User Management

## Role and region directories are super-admin-only
Only Super Admin may see or access Role and Region management. Built-in roles cannot be deleted; custom roles and regions may only be deleted when no users or application records reference them. Directory search and pagination must remain server-side and use distinct query-string page names.

## User management tabs and scope
CHEDCO/CHEDRO administrators receive Users and Roles tabs; only Super Admin receives the Region tab. Non-super admins list/mutate users only in their region and custom roles only in their organization group. Super Admin may list/filter/mutate users across regions and manage all role groups.
