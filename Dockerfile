# 176 TCG: cliente (HTML único) + servidor online en Node
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-optional
COPY . .
RUN npm run build && npm prune --omit=dev --no-optional
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist-servidor/servidor.mjs"]
