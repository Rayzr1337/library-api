FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                     
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev           
COPY --from=builder /app/dist ./dist
EXPOSE 4750
CMD ["node", "dist/src/server.js"]