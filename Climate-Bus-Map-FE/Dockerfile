# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=""
ARG VITE_ODSAY_API_KEY=""
ARG VITE_TMAP_API_KEY=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ODSAY_API_KEY=$VITE_ODSAY_API_KEY
ENV VITE_TMAP_API_KEY=$VITE_TMAP_API_KEY
RUN npm run build

# ---- Run ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
