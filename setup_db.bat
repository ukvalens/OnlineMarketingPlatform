@echo off
SET PSQL=C:\PROGRA~1\POSTGR~1\18\bin\psql.exe

echo === Creating database ===
%PSQL% -U postgres -c "CREATE DATABASE marketing_platform;" 2>nul || echo Database may already exist, continuing...

echo === Running schema ===
%PSQL% -U postgres -d marketing_platform -f backend\db\schema.sql

echo === Running seed ===
%PSQL% -U postgres -d marketing_platform -f backend\db\seed.sql

echo === Running visitor role migration ===
%PSQL% -U postgres -d marketing_platform -f backend\db\migrate_add_visitor_role.sql

echo === Done ===
pause
