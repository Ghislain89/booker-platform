# Booker Platform: web UI + REST API in one container.
#   docker build -t booker .
#   docker run --rm -p 3000:3000 booker
# The database is created and seeded on the first start. Mount a volume on
# /app/prisma/data to keep data between runs.
FROM node:20-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx prisma generate && npm run build && mkdir -p prisma/data

ENV PORT=3000 \
  DATABASE_URL="file:./data/booker.db" \
  UPLOAD_DIR=/app/prisma/data/uploads \
  BOOKER_TEST_API=1

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["sh", "-c", "[ -f prisma/data/booker.db ] || npx prisma migrate reset --force --skip-generate; npm start"]
