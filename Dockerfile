# ---------- Stage 1: Build Frontend ----------
    FROM node:18-alpine AS builder

    WORKDIR /app
    
    # Install dependencies and build frontend
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build
 # ---------- Stage 2: Serve with Express ----------
FROM node:18-alpine

WORKDIR /app

# Copy all app files
COPY --from=builder /app /app

# ✅ Copy videos folder into container
COPY videos ./videos

RUN npm install --omit=dev

EXPOSE 3000

CMD ["node", "server.js"]
