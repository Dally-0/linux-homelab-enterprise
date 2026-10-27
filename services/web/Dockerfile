# Proxy inverso y servidor web con Nginx
FROM nginx:1.27-alpine

# Instalar openssl y generar certificados SSL directamente en el build
RUN apk add --no-cache openssl bash \
    && mkdir -p /etc/ssl/banco /usr/share/nginx/html \
    && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/ssl/banco/server.key \
        -out /etc/ssl/banco/server.crt \
        -subj "/C=BO/O=BANCO SUDOERS/CN=banco.sudoers.lan" \
        -addext "subjectAltName=DNS:sudoers.lan,DNS:*.sudoers.lan,DNS:localhost,IP:192.168.100.85,IP:192.168.0.2,IP:127.0.0.1"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]