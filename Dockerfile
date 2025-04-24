# ---------- Stage 1: Build Frontend ----------
    FROM node:18-alpine AS builder

    WORKDIR /app
    
    # Install dependencies and build frontend
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build
    
    # ---------- Stage 2: Run Express Server ----------
    FROM node:18-alpine
    
    WORKDIR /app
    
    # Copy everything including server.js, videos, etc.
    COPY --from=builder /app /app
    
    # Reinstall only production deps
    RUN npm install --omit=dev
    
    # Expose port (important for Railway/Render)
    EXPOSE 3000
    
    # Start Express server (will serve dist/ too)
    CMD ["node", "server.js"]
    