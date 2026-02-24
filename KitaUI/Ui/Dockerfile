# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Declare build-time variables for Vite (must be set at build time, not runtime)
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_FRONTEND_URL

# Make them available as environment variables during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL

# Build Vite app
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
