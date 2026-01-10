#!/usr/bin/env bun

import {execSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import * as path from 'node:path'
import type {PostToolUseHandler, PostToolUseResponse} from './lib'
import {runHook} from './lib'

const WORKSPACE = '/workspace'
const AGENT_DIR = '/workspace/agent'

const EXCLUDED_PATHS = [
  'node_modules/',
  'dist/',
  '.claude/',
  'agent/src/agent/graphql_client/',
  'src/graphql/generated/',
  '.venv/',
  'venv/',
  '__pycache__/',
]

type FileType = 'typescript' | 'python' | 'prettier-only'

const EXTENSION_MAP: Record<string, FileType> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'typescript',
  '.jsx': 'typescript',
  '.py': 'python',
  '.css': 'prettier-only',
  '.json': 'prettier-only',
  '.md': 'prettier-only',
}

const isExcluded = (filePath: string): boolean => {
  const relativePath = filePath.startsWith(WORKSPACE)
    ? filePath.slice(WORKSPACE.length + 1)
    : filePath
  return EXCLUDED_PATHS.some((excluded) => relativePath.includes(excluded))
}

const getFileType = (filePath: string): FileType | null => {
  const ext = path.extname(filePath).toLowerCase()
  return EXTENSION_MAP[ext] ?? null
}

const runCommand = (
  command: string,
  cwd: string,
  timeout = 30000,
): {success: boolean; output: string} => {
  try {
    execSync(command, {
      cwd,
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    })
    return {success: true, output: ''}
  } catch (error) {
    const execError = error as {stderr?: string; stdout?: string; message?: string}
    const output = execError.stderr ?? execError.stdout ?? execError.message ?? 'Unknown error'
    return {success: false, output}
  }
}

const formatWithPrettier = (filePath: string): {success: boolean; output: string} => {
  return runCommand(`npx prettier --write "${filePath}"`, WORKSPACE)
}

const lintWithEslint = (filePath: string): {success: boolean; output: string} => {
  return runCommand(`npx eslint --fix "${filePath}"`, WORKSPACE)
}

const formatWithRuff = (filePath: string): {success: boolean; output: string} => {
  const relativePath = filePath.startsWith(AGENT_DIR)
    ? filePath.slice(AGENT_DIR.length + 1)
    : filePath
  return runCommand(`uv run ruff format "${relativePath}"`, AGENT_DIR)
}

const lintWithRuff = (filePath: string): {success: boolean; output: string} => {
  const relativePath = filePath.startsWith(AGENT_DIR)
    ? filePath.slice(AGENT_DIR.length + 1)
    : filePath
  return runCommand(`uv run ruff check --fix "${relativePath}"`, AGENT_DIR)
}

const processFile = (filePath: string): PostToolUseResponse => {
  if (!existsSync(filePath)) {
    return {}
  }

  if (isExcluded(filePath)) {
    return {}
  }

  const fileType = getFileType(filePath)
  if (!fileType) {
    return {}
  }

  switch (fileType) {
    case 'typescript': {
      const prettierResult = formatWithPrettier(filePath)
      if (!prettierResult.success) {
        return {decision: 'block', reason: `Prettier failed: ${prettierResult.output}`}
      }

      const eslintResult = lintWithEslint(filePath)
      if (!eslintResult.success) {
        return {decision: 'block', reason: `ESLint found unfixable errors: ${eslintResult.output}`}
      }

      return {}
    }

    case 'python': {
      if (!filePath.startsWith(AGENT_DIR)) {
        return {}
      }

      const ruffLintResult = lintWithRuff(filePath)
      if (!ruffLintResult.success) {
        return {decision: 'block', reason: `Ruff found unfixable errors: ${ruffLintResult.output}`}
      }

      const ruffFormatResult = formatWithRuff(filePath)
      if (!ruffFormatResult.success) {
        return {decision: 'block', reason: `Ruff format failed: ${ruffFormatResult.output}`}
      }

      return {}
    }

    case 'prettier-only': {
      const prettierResult = formatWithPrettier(filePath)
      if (!prettierResult.success) {
        return {decision: 'block', reason: `Prettier failed: ${prettierResult.output}`}
      }

      return {}
    }
  }
}

const postToolUse: PostToolUseHandler = (payload) => {
  const toolInput = payload.tool_input as {file_path?: string}
  const filePath = toolInput.file_path

  if (!filePath) {
    return {}
  }

  return processFile(filePath)
}

runHook({postToolUse})
