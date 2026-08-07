---
paths:
  - 'app/Models/**'
---

# Models

## Regions use internal bigint identifiers
Regions are internal lookup records and use the application's standard unsigned bigint primary key. Users reference regions through a nullable, indexed foreign key; use authorization rather than opaque IDs for security.

## Region and role identifiers use ULIDs
Supersedes the earlier bigint lookup-ID decision. Region and UserRole primary keys are ULIDs, and users.region_id / users.user_role_id are matching nullable ULID foreign keys.
