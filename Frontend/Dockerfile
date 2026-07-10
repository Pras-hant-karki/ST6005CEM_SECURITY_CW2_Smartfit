# Stage 1: build Vite app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Accept API URL as build arg so it can be overridden per environment
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1/patient
ARG VITE_DOCTOR_API_BASE_URL=http://localhost:8000/api/v1/doctor
ARG VITE_DOCTOR_PORTAL_URL=http://localhost:5174/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DOCTOR_API_BASE_URL=$VITE_DOCTOR_API_BASE_URL
ENV VITE_DOCTOR_PORTAL_URL=$VITE_DOCTOR_PORTAL_URL
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
