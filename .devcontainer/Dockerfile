FROM ubuntu:resolute-20251130 AS ubuntu-base

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
    file \
    postgresql-common \
    vim \
  && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -v 18 \
  && apt install -y postgresql-client-18 \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

ENV NVM_DIR=/usr/local/share/nvm
COPY --from=nvm $NVM_DIR $NVM_DIR

USER vscode

RUN mkdir -p /home/vscode/.local/bin

COPY --from=starship --chown=vscode:vscode /usr/local/bin/starship /usr/local/bin/starship
COPY .devcontainer/.config/starship.toml $HOME/.config/starship.toml

RUN curl -LsSf https://github.com/dotenvx/dotenvx/releases/download/v1.49.0/install.sh | sh -s -- --directory=/home/vscode/.local/bin

RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="$HOME/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:0.9.17 /uv /uvx $HOME/.local/bin/

COPY --chown=vscode:vscode .devcontainer/.zshrc $HOME/.zshrc

FROM python:3.14-slim-bookworm AS pydantic-mcp-run-python

COPY --from=ghcr.io/astral-sh/uv:0.9.17 /uv /uvx /bin/
COPY --from=docker.io/denoland/deno:bin-2.5.6 /deno /bin

RUN apt update \
  && apt install -y \
    git \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*
RUN git clone --no-checkout https://github.com/pydantic/mcp-run-python.git /app \
  && cd /app \
  && git fetch --depth 1 origin ff3ebcff1b94fe103c8af560459da9308bee62f5 \
  && git checkout ff3ebcff1b94fe103c8af560459da9308bee62f5

WORKDIR /app

RUN uv sync --frozen --compile-bytecode
RUN uv run build/build.py

WORKDIR /app/mcp_run_python/deno
RUN deno cache src/main.ts

WORKDIR /app

ENTRYPOINT ["uv", "run", "mcp-run-python"]
EXPOSE 4002
CMD ["--port=4002", "--verbose", "--deps", "requests", "streamable-http-stateless"]
