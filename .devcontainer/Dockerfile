FROM mcr.microsoft.com/devcontainers/base:ubuntu AS devcontainer

ENV HOME=/home/vscode
ENV PATH="$HOME/.local/bin:$PATH"

WORKDIR /workspace

SHELL ["/usr/bin/zsh", "-c"]
RUN chsh -s /usr/bin/zsh vscode
ENV SHELL=/usr/bin/zsh

RUN apt update \
  && apt upgrade -y \
  && apt install -y \
    curl \
    postgresql-common \
    vim \
  && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -v 17 \
  && apt install -y postgresql-client-17 \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

ENV NVM_DIR=/usr/local/share/nvm
RUN --mount=type=bind,source=.nvmrc,target=/root/.nvmrc \
  mkdir -p $NVM_DIR \
  && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
  && source $NVM_DIR/nvm.sh \
  && nvm install $(cat /root/.nvmrc) \
  && chown -R vscode:vscode $NVM_DIR

USER vscode

RUN curl -fsSL https://claude.ai/install.sh | bash

RUN curl -sS https://starship.rs/install.sh | sh -s -- --yes
COPY .devcontainer/.config/starship.toml $HOME/.config/starship.toml

RUN curl -LsSf https://github.com/dotenvx/dotenvx/releases/download/v1.49.0/install.sh | sh -s -- --directory=/home/vscode/.local/bin

COPY .devcontainer/.zshrc $HOME/.zshrc
