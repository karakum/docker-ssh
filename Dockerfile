ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY . .

# Connect to container with name/id
ENV CONTAINER=""

# Shell to use inside the container
ENV CONTAINER_SHELL=bash

# Server key
ENV KEYPATH=./id_rsa

# Server port
ENV PORT=22

# Enable web terminal
ENV HTTP_ENABLED=true

# HTTP Port
ENV HTTP_PORT=8022

EXPOSE 22 8022

CMD ["npm", "start"]
