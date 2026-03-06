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
# 1. Copy the build output (usually 'dist' for Vite) to Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# 2. Copy your custom nginx.conf to the config folder
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]