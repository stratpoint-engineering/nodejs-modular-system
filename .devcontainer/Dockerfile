FROM node:20-bullseye

# Set working directory
WORKDIR /workspace

# Install global packages
RUN npm install -g nodemon typescript

# Set timezone
ENV TZ=Asia/Manila
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install additional development tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install git curl wget vim nano less \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Switch to non-root user
USER node

# Set default shell to bash
ENV SHELL /bin/bash
