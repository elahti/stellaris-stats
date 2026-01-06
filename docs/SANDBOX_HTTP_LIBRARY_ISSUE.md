# Sandbox HTTP Library Issue

## Overview

The MCP sandbox used by all AI agents (neighbor detection, root cause analysis, budget analysis, etc.) runs Python in **Pyodide** (Python compiled to WebAssembly). This environment has significant limitations with HTTP libraries that must be understood when implementing agents.

## The Problem

### Root Cause

Pyodide executes Python via the Deno JavaScript runtime. HTTP requests don't go through the Python `socket` module—instead, they go through **JavaScript's `fetch` API**, which has security restrictions:

- ✅ **Works**: DNS resolution, TCP socket connections (at socket level)
- ❌ **Fails**: HTTP requests via `urllib` to internal Docker network IPs
- ✅ **Works**: HTTP requests via `httpx` (uses Deno's fetch correctly)

### Why urllib Fails

`urllib.request.urlopen()` in Pyodide attempts to use Python's socket operations, but these don't properly integrate with Deno's fetch API. Requests time out when trying to reach internal Docker IPs like `devcontainer:4000` or `172.29.0.3:4000`.

### Why httpx Works

`httpx` is a modern HTTP client that properly delegates to JavaScript's `fetch` API when running in Pyodide. It handles the browser/Deno sandbox restrictions correctly.

## Historical Context

The neighbor_multi agent eval pass rate was **57.9%** (vs 89.47% after fix) because:

1. The system prompts didn't include httpx examples
2. LLMs naturally generate urllib code (it's more common in Python)
3. All urllib-based requests failed in the sandbox
4. Agents returned empty results or errors

This issue affected ALL sandbox-based agents, not just neighbor detection.

## Affected Agents

All agents that use the MCP sandbox for Python execution:

- `neighbor_multi` - Neighbor detection and diplomatic analysis
- `neighbor_single` - Single neighbor analysis
- `sandbox` - Drop detection with code execution
- `root_cause_multi` - Drop detection + root cause analysis
- `root_cause_single` - Root cause analysis only

## How to Fix Agent Prompts

### Current Status (Fixed)

The following prompt files already include httpx instructions:
- `agent/src/agent/sandbox/prompts.py` ✅
- `agent/src/agent/root_cause_multi/prompts.py` ✅
- `agent/src/agent/root_cause_single/prompts.py` ✅
- `agent/src/agent/root_cause_multi/root_cause_prompts.py` ✅
- `agent/src/agent/neighbor_single/prompts.py` ✅
- `agent/src/agent/neighbor_multi/prompts.py` ✅ (Fixed in this session)

### What to Include in Prompts

If you create new agents that use the sandbox, include these elements:

1. **Clear tool usage format**:
   ```
   IMPORTANT: When calling the tool, you MUST provide the `python_code` argument.
   Example tool call format:
   - Tool: run_python_code
   - Argument: python_code = "import httpx; print('hello')"
   ```

2. **CRITICAL RULES section** with httpx requirement:
   ```
   ## CRITICAL RULES

   1. Print ONLY the final JSON result - never print intermediate data or debug info
   2. Use httpx for HTTP requests (available in sandbox)
   3. Handle null/missing values gracefully
   ```

3. **Example Code Structure** showing httpx usage:
   ```python
   import httpx
   import json

   GRAPHQL_URL = "{graphql_url}"
   SAVE_FILENAME = "{{save_filename}}"

   with httpx.Client(timeout=180.0) as client:
       resp = client.post(GRAPHQL_URL, json={{
           "query": query,
           "variables": {{"filename": SAVE_FILENAME}}
       }})
       data = resp.json()
   ```

## Testing

### Sandbox Network Test Script

Use the included test script to verify sandbox network connectivity:

```bash
npm run agent:sandbox-network-test
```

This script:
- Tests DNS resolution from sandbox
- Tests TCP socket connections
- Tests urllib HTTP requests (will fail)
- Tests httpx HTTP requests (will succeed)

### Expected Output

```
Python platform: emscripten
...
TEST 1: DNS Resolution
SUCCESS: devcontainer -> 172.29.1.0

TEST 2: TCP Socket Connection
SUCCESS: TCP connection to 172.29.1.0:4000 succeeded

TEST 3: HTTP Request (urllib)
FAILED: URLError: <urlopen error timed out>

TEST 4: HTTP Request (httpx)
SUCCESS: Got response: {"data":{"__typename":"Query"}}
```

## Performance Implications

- **httpx in Pyodide**: ~2-3 seconds per request (normal for sandbox)
- **urllib in Pyodide**: Times out (~10+ seconds per retry attempt)

Using httpx vs urllib can improve eval execution time significantly.

## Future Work

### Potential Improvements

1. **Create native agents**: For performance-critical paths, create Python agents that run natively (not in sandbox) using the pattern from `native_budget`:
   - Uses native `httpx.Client` without Pyodide overhead
   - Significantly faster
   - Example: `agent/src/agent/native_budget/tools.py`

2. **Sandbox optimization**: Monitor pydantic-mcp-run-python for potential upstream improvements

3. **Proxy HTTP requests**: Consider a local proxy service that sandbox agents can connect to

### Why Create Native Agents?

The sandbox adds ~30-50% overhead per request due to Deno/WebAssembly execution. For agents that don't need code execution flexibility, native agents are preferable:

- `native_budget` is 2-3x faster than `sandbox` for similar tasks
- No HTTP library compatibility issues
- Direct access to Python ecosystem

## Debugging

If an agent using the sandbox is failing:

1. **Check Logfire traces** for HTTP-related errors:
   - `RemoteDisconnected` errors = server didn't respond
   - `URLError: timed out` = request timed out (likely urllib in sandbox)

2. **Run the sandbox network test**:
   ```bash
   npm run agent:sandbox-network-test
   ```
   This confirms sandbox can reach GraphQL server.

3. **Check agent prompts**:
   - Ensure they include httpx examples
   - Verify they're in CRITICAL RULES section
   - Look for urllib mentions that need to be changed to httpx

4. **Enable Pyodide debugging**:
   In Logfire, look for `pydantic_ai.all_messages` to see the generated Python code:
   - Search for `urllib` in generated code → agent needs prompt fix
   - Search for `httpx` → agent is using correct library

## References

- **Pyodide**: https://pyodide.org/
- **httpx Documentation**: https://www.python-httpx.org/
- **MCP Run Python**: https://github.com/pydantic/mcp-run-python
- **Deno Fetch API**: https://docs.deno.com/api/web/fetch/

## Summary

**Always use httpx in sandbox agents, never urllib.** Include clear examples in system prompts, and consider native agents for performance-critical code paths.
