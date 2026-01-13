FROM ubuntu:resolute-20251208@sha256:12aa2ae97b9b295d28962e83cb36cb478f3afbdda68196e5fd62e68bde3a67d5 AS ubuntu-base

RUN apt update \
  && apt install -y \
    curl \
    zsh \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/zsh", "-c"]
ENV SHELL=/bin/zsh

FROM ubuntu-base AS starship

RUN curl -sS https://starship.rs/install.sh | sh -s -- --yes -v v1.24.1

FROM ubuntu-base AS nvm

ENV NVM_DIR=/usr/local/share/nvm
RUN --mount=type=bind,source=.nvmrc,target=/root/.nvmrc \
  mkdir -p $NVM_DIR \
  && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
  && source $NVM_DIR/nvm.sh \
  && nvm install $(cat /root/.nvmrc)

FROM mcr.microsoft.com/devcontainers/base:ubuntu@sha256:c1613dbcdafe28e4b36ede9f3cb84a96e76765f50b3aeee87cb589eeb4c6dbca AS devcontainer

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
    file \
    postgresql-common \
    shellcheck \
    vim \
  && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -v 18 \
  && apt install -y postgresql-client-18 \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

ENV NVM_DIR=/usr/local/share/nvm
COPY --from=nvm $NVM_DIR $NVM_DIR

RUN git config --system core.checkStat minimal

USER vscode

RUN mkdir -p /home/vscode/.local/bin

COPY --from=starship --chown=vscode:vscode /usr/local/bin/starship /usr/local/bin/starship
COPY .devcontainer/.config/starship.toml $HOME/.config/starship.toml

RUN curl -LsSf https://github.com/dotenvx/dotenvx/releases/download/v1.49.0/install.sh | sh -s -- --directory=/home/vscode/.local/bin

RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="$HOME/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:0.9.21@sha256:15f68a476b768083505fe1dbfcc998344d0135f0ca1b8465c4760b323904f05a /uv /uvx $HOME/.local/bin/

COPY --chown=vscode:vscode .devcontainer/.zshrc $HOME/.zshrc

FROM python:3.14-slim-bookworm@sha256:55b18d5d89ddb3ef534fe447f660a35832559c2361f8ea3985a5fcda95396f97 AS pydantic-mcp-run-python

RUN apt update \
  && apt install -y \
    git \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*
RUN git clone --no-checkout https://github.com/pydantic/mcp-run-python.git /app \
  && cd /app \
  && git fetch --depth 1 origin 5ee2eea318725f78c22417e6f8a8374a5c9684ec \
  && git checkout 5ee2eea318725f78c22417e6f8a8374a5c9684ec

COPY --from=ghcr.io/astral-sh/uv:0.9.21@sha256:15f68a476b768083505fe1dbfcc998344d0135f0ca1b8465c4760b323904f05a /uv /uvx /bin/
COPY --from=docker.io/denoland/deno:bin-2.5.6@sha256:2f5f9d651af33c337767c423a340f76df35e35ff8ff4734210237b9c6fed94c7 /deno /bin

WORKDIR /app

RUN uv sync --frozen --compile-bytecode
RUN uv run build/build.py

WORKDIR /app/mcp_run_python/deno
RUN deno cache src/main.ts

WORKDIR /app

ENTRYPOINT ["uv", "run", "mcp-run-python"]
EXPOSE 4002
CMD ["--port=4002", "--verbose", "--deps", "requests,httpx", "streamable-http-stateless"]
