# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine
RUN apk add --no-cache gettext

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy your nginx.conf as a template
COPY nginx.conf /etc/nginx/conf.d/nginx.template

EXPOSE 80

# Use envsubst to replace $RAILWAY_BACKEND_URL at runtime
CMD ["/bin/sh", "-c", "envsubst '$RAILWAY_BACKEND_URL' < /etc/nginx/conf.d/nginx.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]