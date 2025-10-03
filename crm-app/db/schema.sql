# 1) crear BD (si hace falta)
createdb pmc_crm

# 2) ejecutar esquema
psql -d pmc_crm -f db/schema.sql

# 3) cargar datos de prueba
psql -d pmc_crm -f db/seed.sql
