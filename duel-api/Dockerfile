# Use the official Node.js runtime as the base image
FROM node:18-slim

# Install OpenSSL and other dependencies needed by Prisma
RUN apt-get update -y && apt-get install -y openssl curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies as root
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Generate Prisma client as root
RUN npx prisma generate

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of EVERYTHING to nodejs user (including node_modules)
RUN chown -R nodejs:nodejs /app

# Switch to the nodejs user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

# Command to run the application
CMD ["npm", "start"]