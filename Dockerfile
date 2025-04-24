# --------- Stage 1: Build React Frontend with Vite ----------
    FROM node:18-alpine as build

    WORKDIR /app
    
    # Copy and install dependencies
    COPY package*.json ./
    RUN npm install
    
    # Copy all files and build frontend
    COPY . .
    RUN npm run build
    
    # --------- Stage 2: Run Express Server ----------
    FROM node:18-alpine
    
    WORKDIR /app
    
    # Copy app and build artifacts
    COPY --from=build /app /app
    
    # Install only production deps
    RUN npm install --omit=dev
    
    # Expose port
    EXPOSE 3000
    
    # Enable ES Modules
    ENV NODE_ENV=production
    
    # Start the Express server
    CMD ["node", "server.js"]
    