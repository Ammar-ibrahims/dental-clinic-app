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

# Copy the config directly to the config folder (NOT the template folder)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Force Nginx to use port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]