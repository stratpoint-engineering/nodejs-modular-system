FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package.json ./packages/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build packages
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built packages from builder stage
COPY --from=builder /app/packages/*/dist ./packages/
COPY --from=builder /app/core ./core
COPY --from=builder /app/app.js ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "app.js"]
