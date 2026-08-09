---
paths:
  - '{app/Providers/AppServiceProvider.php,app/Http/Middleware/HandleInertiaRequests.php,resources/js/components/app-sidebar.tsx,resources/js/types/auth.ts}'
  - '{app/Providers/AppServiceProvider.php,app/Http/Middleware/HandleInertiaRequests.php,routes/web.php,resources/js/components/app-sidebar.tsx,resources/js/types/auth.ts}'
---

# Types

## Super Admin has full management access
Super Admin is a global authorization override and must pass every application gate, including Form Management. Navigation visibility must use shared gate-derived permission props instead of hardcoded role-name checks.

## Role access matrix
Super Admin has global access. CHEDCO Administrator and CHEDRO Administrator may view statistics and manage forms, users, and roles within their assigned region/group. CHEDCO/CHEDRO staff plus custom and agency roles have incident/responder access only. Navigation must remain gate-derived.
