FROM node:22-bookworm-slim

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN chmod +x entrypoint.sh \
    && mkdir -p /app/uploads/avatars \
    && chown -R node:node /app

USER node
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "start"]
