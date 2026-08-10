# Project Rules Index

Before planning or editing, find the row whose globs match the file's path and read that rule file.

| Applies to | Rule file |
| --- | --- |
| app/** | .ai/rules/app.md |
| {app/Http/Controllers/FormManagementController.php,app/Http/Controllers/IncidentFormController.php,app/Models/IncidentForm.php} | .ai/rules/controllers-models.md |
| {app/Http/Controllers/IncidentController.php,resources/js/pages/incidents/show.tsx,tests/Feature/IncidentTest.php} | .ai/rules/feature.md |
| {app/Models/{IncidentType,IncidentSubcategory}.php,app/Http/Controllers/{FormManagement,IncidentType,IncidentSubcategory,IncidentForm,IncidentStatus}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/form-management/**,database/migrations/**} | .ai/rules/form-management-migrations.md |
| resources/js/pages/form-management/** | .ai/rules/form-management.md |
| {app/Http/Controllers/IncidentController.php,app/Models/Incident.php} | .ai/rules/http-controllers-models.md |
| {app/Providers/AppServiceProvider.php,app/Http/Requests/UpdateIncidentStatusRequest.php,resources/js/pages/incidents/show.tsx} | .ai/rules/http-requests-js-pages-incidents.md |
| {app/Http/Controllers/{Incident,IncidentStatus}Controller.php,resources/js/pages/incidents/**}, {app/Http/Controllers/IncidentController.php,resources/js/pages/incidents/show.tsx} | .ai/rules/incidents.md |
| {app/Http/Controllers/{Incident,IncidentMessage}Controller.php,app/Models/IncidentMessage*.php,resources/js/pages/incidents/**} | .ai/rules/js-pages-incidents.md |
| resources/js/pages/statistics.tsx | .ai/rules/js-pages.md |
| {app/Models/{User,UserRole,Region}.php,database/seeders/RegionSeeder.php,database/migrations/**} | .ai/rules/migrations.md |
| app/Models/** | .ai/rules/models.md |
| {app/Models/IncidentStatus.php,app/Http/Controllers/IncidentStatusController.php,app/Http/Requests/UpdateIncidentStatusesRequest.php,resources/js/pages/form-management/**} | .ai/rules/pages-form-management.md |
| {app/Http/Controllers/IncidentController.php,app/Http/Requests/UpdateIncidentRequest.php,resources/js/pages/incidents/**} | .ai/rules/pages-incidents.md |
| {app/Models/UserRole.php,app/Http/Controllers/UserManagementController.php,resources/js/pages/user-management/**} | .ai/rules/pages-user-management.md |
| {app/Http/Controllers/StatisticsController.php,resources/js/pages/statistics.tsx}, {app/Http/Controllers/{Statistics,Incident}Controller.php,resources/js/pages/{statistics.tsx,incidents/index.tsx}} | .ai/rules/pages.md |
| {app/Models/Incident.php,app/Http/Controllers/{Incident,IncidentMessage}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/incidents/show.tsx}, {app/Models/Incident.php,app/Http/Controllers/{Incident,IncidentRouting,IncidentMessage}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/incidents/**} | .ai/rules/requests-js-pages-incidents.md |
| {app/Http/Controllers/{Statistics,Incident,FormManagement,IncidentForm}Controller.php,app/Http/Requests/*Incident*Request.php,resources/js/pages/{statistics.tsx,incidents/**,form-management/**}} | .ai/rules/requests-js-pages.md |
| {app/Http/Controllers/UserManagementController.php,app/Http/Requests/*UserRequest.php} | .ai/rules/requests.md |
| app/Http/Responses/LoginResponse.php | .ai/rules/responses.md |
| {app/Providers/AppServiceProvider.php,app/Http/Middleware/HandleInertiaRequests.php,resources/js/components/app-sidebar.tsx,resources/js/types/auth.ts}, {app/Providers/AppServiceProvider.php,app/Http/Middleware/HandleInertiaRequests.php,routes/web.php,resources/js/components/app-sidebar.tsx,resources/js/types/auth.ts} | .ai/rules/types.md |
| {app/Http/Controllers/{UserManagementController,UserRoleController,RegionController}.php,app/Http/Requests/Store{UserRole,Region}Request.php,resources/js/pages/user-management/**}, {app/Http/Controllers/{UserManagement,UserRole,Region}Controller.php,app/Http/Requests/{Store,Update}User*Request.php,resources/js/pages/user-management/**} | .ai/rules/user-management.md |
