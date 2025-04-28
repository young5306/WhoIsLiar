FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --production

COPY . .

COPY .env .env

RUN npm run build


FROM nginx:alpine


WORKDIR /usr/share/nginx/html


COPY --from=build-stage /app/dist .


COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
