# The official image with this fork's interface and server files on top
FROM louislam/uptime-kuma:2.5.11
COPY --chown=node:node dist /app/dist
COPY --chown=node:node server /app/server
COPY --chown=node:node db /app/db
COPY --chown=node:node package.json /app/package.json
