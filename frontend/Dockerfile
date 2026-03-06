# Stage 1: Build
FROM node:18-alpine AS build
# Add build argument for Railway to pass the API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine
RUN apk add --no-cache gettext
# 1. Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html
# 2. Copy your nginx.conf as a template
COPY nginx.conf /etc/nginx/conf.d/nginx.template
EXPOSE 80
# 3. Use envsubst to replace variables at runtime
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/nginx.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]