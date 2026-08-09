---
paths:
  - '{app/Models/{User,UserRole,Region}.php,database/seeders/RegionSeeder.php,database/migrations/**}'
---

# Migrations

## Central Office region invariant
CHED Central Office is the required, protected region for all Central Office roles, including Super Admin. It must be seeded/migrated, Central Office user assignment validation must enforce it, and the region must never be deletable.
