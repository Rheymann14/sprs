---
paths:
  - 'app/**'
---

# App

## Login-capable users require a current team
Every user creation path that produces a login-capable account must create a personal team, attach the user as owner, and set current_team_id. Reuse App\Actions\Teams\CreateTeam so team-scoped login redirects always have a {current_team} parameter.

## Application has no team domain
The team feature was removed. Authentication and navigation use the global /dashboard route; user creation must not create team records or depend on current_team_id. Do not add team-scoped URLs, shared props, middleware, models, or redirects.

## Login-capable users require a current team
Superseded: the team feature has been removed. Login-capable users must not create or require teams; all authenticated redirects use the global /dashboard route.
