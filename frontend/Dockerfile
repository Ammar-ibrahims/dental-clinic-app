# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Use Nginx's official template directory for automatic envsubst
# This substitutes ${PORT} and other variables automatically at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default PORT if not provided by Railway
ENV PORT=80

EXPOSE 80