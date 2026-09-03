#!/bin/sh
set -eu

provider="${DB_PROVIDER:-sqlite}"
case "$provider" in
  sqlite|mysql) ;;
  *) echo "DB_PROVIDER non supporté: $provider" >&2; exit 1 ;;
esac

cp "prisma/schema.${provider}.prisma" prisma/schema.prisma
npx --no-install prisma generate

if [ "${RUN_DB_SCHEMA_SYNC:-false}" = "true" ]; then
  echo "Synchronisation explicite du schéma (les changements destructifs seront refusés)"
  npx --no-install prisma db push
fi

exec "$@"
