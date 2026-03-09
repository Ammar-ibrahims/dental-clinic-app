# Stage 1: Install dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 2: Final image
FROM node:18-alpine
WORKDIR /app
# Copy only the necessary files from the dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
# Copy the source code
COPY . .

# Expose the internal backend port (usually matched with environment PORT)
EXPOSE 8000

# Start the application
CMD ["node", "src/index.js"]