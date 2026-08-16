---
paths:
  - '{app/Http/Controllers/IncidentController.php,resources/js/pages/incidents/show.tsx,tests/Feature/IncidentTest.php}'
---

# Feature

## Incident file index stays complete and lightweight
The incident show page exposes all conversation attachment metadata through a deferred prop independent of the bounded message history. Group files by message sender and timestamp, render only four files initially with an explicit show-more control, and lazy-load image content/full previews.

## Conversation files use a searchable paginated table
Flatten conversation attachments into table rows with Uploaded By, clickable Document File Name plus attachment type, and Date Uploaded. Keep four rows per client-side page, search attachment/uploader metadata, lazy-load image previews, and label uploader groups distinctly as CHED CO, CHED RO, or Agency.

## Incident file index stays complete and lightweight
The incident show page exposes all conversation attachment metadata through a deferred prop independent of bounded message history. Render a searchable table with four attachments per client-side page, and lazy-load image content/full previews.

## Paginated table supersedes the file gallery
Supersedes the earlier explicit show-more control: conversation attachments now use four-row client-side pagination in the searchable table. Do not restore the grouped horizontal gallery or show-more button.
