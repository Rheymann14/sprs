---
paths:
  - '{app/Models/{AttachmentType,IncidentMessageAttachment}.php,app/Http/Controllers/{AttachmentType,IncidentMessage}Controller.php,app/Http/Requests/*AttachmentTypeRequest.php,app/Http/Requests/StoreIncidentMessageRequest.php,resources/js/pages/incidents/show.tsx}'
---

# Requests Http Requests Js Pages Incidents

## Conversation attachment types are region-owned
Attachment types belong to the uploader's assigned region. Conversation responders may select only types from their own region; manage-forms users may add, rename, or delete only types they can regionally access. Deleting a type must preserve historical attachment files and null their type reference.
