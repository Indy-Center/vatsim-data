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
RUN npm ci

# Set environment variables
ENV NODE_ENV=production

# Add labels
LABEL org.opencontainers.image.title="VATSIM Data API"
LABEL org.opencontainers.image.description="API service for VATSIM data"
LABEL org.opencontainers.image.version="${BUILD_NUMBER}"
LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"

# Start API server using ts-node
CMD ["npx", "ts-node", "src/server.ts"]

# Ingest loop application stage
FROM node:20-alpine AS ingest

WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies
RUN npm ci

# Set environment variables
ENV NODE_ENV=production

# Add labels
LABEL org.opencontainers.image.title="VATSIM Data Ingest"
LABEL org.opencontainers.image.description="Ingest service for VATSIM data"
LABEL org.opencontainers.image.version="${BUILD_NUMBER}"
LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"

# Start ingest loop using ts-node
CMD ["npx", "ts-node", "src/scripts/runIngestLoop.ts"] 