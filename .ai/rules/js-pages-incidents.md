---
paths:
  - '{app/Http/Controllers/{Incident,IncidentMessage}Controller.php,app/Models/IncidentMessage*.php,resources/js/pages/incidents/**}'
---

# Js Pages Incidents

## Incident conversations use office labels and public attachments
Incident message senders are labeled CHED CO for Central Office roles and CHED RO for Regional Office or Agency roles. Message/report uploads intended for viewing are stored on the public disk for storage:link URLs; preserve region-scoped access and delete stored attachment files when incidents are deleted.
