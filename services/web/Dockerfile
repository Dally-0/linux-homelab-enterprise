# Proxy inverso y servidor web con Nginx
FROM nginx:1.27-alpine

# Instalar openssl para generación autónoma de certificados TLS
RUN apk add --no-cache openssl bash

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]