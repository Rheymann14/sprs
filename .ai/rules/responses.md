---
paths:
  - app/Http/Responses/LoginResponse.php
---

# Responses

## Staff login destination
After successful login, CHEDCO staff (`co-staff`) and CHEDRO staff (`ro-staff`) default to the named `incidents.index` route. Other roles retain the statistics destination; preserve Fortify's intended redirect and JSON response behavior.
