# Use a base Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Expose the port your server listens on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
