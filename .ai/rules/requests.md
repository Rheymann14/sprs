---
paths:
  - '{app/Http/Controllers/UserManagementController.php,app/Http/Requests/*UserRequest.php}'
---

# Requests

## User management stays within the authenticated region
User management lists, creates, updates, and deletes only users whose region_id matches the authenticated manager. Region choices and validation must not permit cross-region assignment.
