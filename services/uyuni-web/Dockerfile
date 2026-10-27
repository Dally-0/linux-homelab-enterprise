# Multi-stage build para la web Uyuni Way (React + Vite)
# Etapa 1: Compilación de assets con Node en Debian Slim (compatible con glibc/rollup)
FROM node:20-slim AS builder

WORKDIR /app

ENV VITE_SUPABASE_URL=https://placeholder.supabase.co
ENV VITE_SUPABASE_ANON_KEY=placeholder-key

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Etapa 2: Servidor web de producción ligero Nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
