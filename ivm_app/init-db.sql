-- Initialize additional databases for development
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create development database (production database 'ivm_db' is created automatically)
CREATE DATABASE ivm_development;

-- Grant permissions to ivm_user for both databases
GRANT ALL PRIVILEGES ON DATABASE ivm_db TO ivm_user;
GRANT ALL PRIVILEGES ON DATABASE ivm_development TO ivm_user;