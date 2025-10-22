#!/bin/bash

# IVM Docker Management Script
# Usage: ./manage.sh [command]

set -e

DB_CONTAINER="ivm_postgres"
APP_CONTAINER="ivm_app"
DEV_CONTAINER="ivm_app_dev"

case "$1" in
    start)
        echo "Starting IVM application with PostgreSQL..."
        docker-compose up -d postgres
        echo "Waiting for PostgreSQL to be ready..."
        sleep 10
        docker-compose up -d ivm_app
        echo "Application started! Visit http://localhost:3000"
        ;;
    
    start-dev)
        echo "Starting development environment..."
        docker-compose up -d postgres
        echo "Waiting for PostgreSQL to be ready..."
        sleep 10
        docker-compose --profile dev up -d
        echo "Development environment started!"
        echo "Production: http://localhost:3000"
        echo "Development: http://localhost:3001"
        ;;
    
    stop)
        echo "Stopping all services..."
        docker-compose down
        ;;
    
    restart)
        echo "Restarting application..."
        docker-compose restart ivm_app
        ;;
    
    rebuild)
        echo "Rebuilding application..."
        docker build -t ivm_app .
        docker-compose down
        docker-compose up -d
        ;;
    
    migrate)
        echo "Running database migrations..."
        docker-compose exec ivm_app npx prisma migrate deploy
        ;;
    
    migrate-dev)
        echo "Running development database migrations..."
        docker-compose exec ivm_app_dev npx prisma migrate dev
        ;;
    
    seed)
        echo "Seeding database..."
        docker-compose exec ivm_app npx prisma db seed
        ;;
    
    db-reset)
        echo "Resetting database..."
        docker-compose exec ivm_app npx prisma migrate reset --force
        ;;
    
    logs)
        if [ -n "$2" ]; then
            docker-compose logs -f "$2"
        else
            docker-compose logs -f
        fi
        ;;
    
    shell)
        SERVICE=${2:-ivm_app}
        echo "Opening shell in $SERVICE..."
        docker-compose exec "$SERVICE" sh
        ;;
    
    db-shell)
        echo "Opening PostgreSQL shell..."
        docker-compose exec postgres psql -U ivm_user -d ivm_db
        ;;
    
    backup)
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "Creating database backup: $BACKUP_FILE"
        docker-compose exec postgres pg_dump -U ivm_user ivm_db > "$BACKUP_FILE"
        echo "Backup created: $BACKUP_FILE"
        ;;
    
    restore)
        if [ -z "$2" ]; then
            echo "Usage: ./manage.sh restore <backup_file.sql>"
            exit 1
        fi
        echo "Restoring database from $2..."
        docker-compose exec -T postgres psql -U ivm_user -d ivm_db < "$2"
        ;;
    
    status)
        echo "Service status:"
        docker-compose ps
        ;;
    
    *)
        echo "IVM Docker Management Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start         - Start production application"
        echo "  start-dev     - Start both production and development"
        echo "  stop          - Stop all services"
        echo "  restart       - Restart application"
        echo "  rebuild       - Rebuild and restart application"
        echo "  migrate       - Run database migrations (production)"
        echo "  migrate-dev   - Run database migrations (development)"
        echo "  seed          - Seed database with initial data"
        echo "  db-reset      - Reset database (WARNING: destroys data)"
        echo "  logs [service]- View logs (optional: specify service)"
        echo "  shell [service]- Open shell in container"
        echo "  db-shell      - Open PostgreSQL shell"
        echo "  backup        - Create database backup"
        echo "  restore <file>- Restore database from backup"
        echo "  status        - Show service status"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs postgres"
        echo "  $0 shell ivm_app"
        echo "  $0 backup"
        echo "  $0 restore backup_20241021_143000.sql"
        ;;
esac