# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/event-registration-system .

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server/server.mjs"]
