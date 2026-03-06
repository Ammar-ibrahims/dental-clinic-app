# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine

# 1. Copy the built React/Vite files
COPY --from=build /app/dist /usr/share/nginx/html

# 2. Copy the config directly to the standard Nginx location
# This avoids the "envsubst" crash you are seeing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Railway will route traffic to port 80 based on your settings
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]