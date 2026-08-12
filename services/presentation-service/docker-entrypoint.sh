#!/bin/sh
set -eu

attempt=1
until alembic upgrade head; do
    if [ "$attempt" -ge 15 ]; then
        echo "Database migration failed after $attempt attempts" >&2
        exit 1
    fi
    attempt=$((attempt + 1))
    sleep 2
done
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8081}"
