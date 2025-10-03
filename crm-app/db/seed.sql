# 1) crear BD
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pmc_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2) ejecutar scripts
mysql -u root -p pmc_crm < db/schema.sql
mysql -u root -p pmc_crm < db/seed.sql
