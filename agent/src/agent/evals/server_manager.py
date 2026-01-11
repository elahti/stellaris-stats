from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass

from agent.evals.test_database import TestDatabaseContext

SERVER_READY_TIMEOUT_SECONDS = 30


@dataclass
class GraphQLServerProcess:
    process: asyncio.subprocess.Process
    url: str
    port: int


async def start_graphql_server(
    db_ctx: TestDatabaseContext,
) -> GraphQLServerProcess:
    env = {
        **os.environ,
        "TEST_DB_HOST": db_ctx.settings.stellaris_stats_db_host,
        "TEST_DB_PORT": str(db_ctx.settings.stellaris_stats_db_port),
        "TEST_DB_NAME": db_ctx.db_name,
        "TEST_DB_USER": db_ctx.settings.stellaris_stats_db_user,
        "TEST_DB_PASSWORD": db_ctx.settings.stellaris_stats_db_password,
    }

    process = await asyncio.create_subprocess_exec(
        "npx",
        "tsx",
        "src/graphql/testGraphQLServerMain.ts",
        env=env,
        cwd="/workspace",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    port = await _wait_for_server_ready(process)

    return GraphQLServerProcess(
        process=process,
        url=f"http://localhost:{port}/graphql",
        port=port,
    )


async def stop_graphql_server(server: GraphQLServerProcess) -> None:
    server.process.terminate()
    try:
        await asyncio.wait_for(server.process.wait(), timeout=5.0)
    except TimeoutError:
        server.process.kill()
        await server.process.wait()


async def _wait_for_server_ready(
    process: asyncio.subprocess.Process,
) -> int:
    if process.stdout is None:
        raise RuntimeError("Process stdout is not available")

    async def read_until_ready() -> int:
        assert process.stdout is not None
        while True:
            line = await process.stdout.readline()
            if not line:
                stderr_content = b""
                if process.stderr:
                    stderr_content = await process.stderr.read()
                stderr_str = stderr_content.decode()
                raise RuntimeError(
                    f"Server process ended before ready signal. stderr: {stderr_str}",
                )

            line_str = line.decode().strip()
            if line_str.startswith("SERVER_READY:"):
                port_str = line_str.split(":")[1]
                return int(port_str)

    try:
        return await asyncio.wait_for(
            read_until_ready(),
            timeout=SERVER_READY_TIMEOUT_SECONDS,
        )
    except TimeoutError as e:
        process.terminate()
        raise RuntimeError(
            f"Server did not become ready within {SERVER_READY_TIMEOUT_SECONDS} seconds",
        ) from e
