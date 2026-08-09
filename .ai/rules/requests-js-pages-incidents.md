---
paths:
  - '{app/Models/Incident.php,app/Http/Controllers/{Incident,IncidentMessage}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/incidents/show.tsx}'
---

# Requests Js Pages Incidents

## Closed incident statuses lock conversation
Managed status actions use each subcategory's configured status names and icon meanings. Circle-check and circle-alert statuses close the incident conversation and block messages/uploads in both UI and server authorization; the clock status reopens it.
