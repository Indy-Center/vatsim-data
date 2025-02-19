# Base image for both applications
FROM node:20-alpine

# Build arguments
ARG BUILD_NUMBER
ARG GITHUB_REPOSITORY
ENV BUILD_NUMBER=${BUILD_NUMBER}

# API application stage
FROM node:20-alpine AS api

WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies
RUN npm install --omit=dev

# Set environment variables
ENV NODE_ENV=production


# Start API server using ts-node
CMD ["npx", "ts-node", "src/server.ts"]