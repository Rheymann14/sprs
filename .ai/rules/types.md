---
paths:
  - '{app/Providers/AppServiceProvider.php,app/Http/Middleware/HandleInertiaRequests.php,resources/js/components/app-sidebar.tsx,resources/js/types/auth.ts}'
---

# Types

## Super Admin has full management access
Super Admin is a global authorization override and must pass every application gate, including Form Management. Navigation visibility must use shared gate-derived permission props instead of hardcoded role-name checks.
