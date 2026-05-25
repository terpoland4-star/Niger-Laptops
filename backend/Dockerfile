FROM node:22-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    vips-tools

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

RUN mkdir -p uploads/products uploads/banners

EXPOSE 3000

CMD ["node", "dist/index.js"]
