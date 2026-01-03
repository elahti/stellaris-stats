import { z } from 'zod/v4'

export const NameSchema = z.union([
  z.object({
    key: z.string(),
    variables: z
      .array(
        z.object({
          key: z.union([z.string(), z.number()]),
          value: z.object({ key: z.string() }).optional(),
        }),
      )
      .optional(),
  }),
  z.string(),
])

export type NameData = z.infer<typeof NameSchema>

const EMPIRE_PREFIXES = ['EMPIRE_DESIGN_', 'NAME_', 'SPEC_']
const PLANET_PREFIXES = [
  'MAM1_PLANET_',
  'MAM2_PLANET_',
  'NEW_COLONY_NAME_',
  'NAME_',
]

const stripPrefixes = (name: string, prefixes: readonly string[]): string => {
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length)
    }
  }
  return name
}

export const extractDisplayName = (nameData: unknown): string => {
  if (!nameData) return 'Unknown'
  if (typeof nameData === 'string') return nameData

  if (typeof nameData === 'object' && 'key' in nameData) {
    const obj = nameData as {
      key: string
      variables?: { key?: string | number; value?: { key: string } }[]
    }
    let name = obj.key

    if (obj.variables && name === '%ADJECTIVE%') {
      const parts = obj.variables.map((v) => v.value?.key ?? '').filter(Boolean)
      name = parts.join(' ')
    }

    name = stripPrefixes(name, EMPIRE_PREFIXES)
    return name.replace(/_/g, ' ')
  }
  return 'Unknown'
}

export const extractPlanetName = (nameData: unknown): string => {
  if (!nameData) return 'Unknown'
  if (typeof nameData === 'string') return nameData

  if (typeof nameData === 'object' && 'key' in nameData) {
    const obj = nameData as {
      key: string
      variables?: { key?: string | number; value?: { key: string } }[]
    }
    let name = obj.key

    if (name === 'PLANET_NAME_FORMAT' && obj.variables) {
      const parts = obj.variables
        .map((v) => v.value?.key ?? (typeof v.key === 'string' ? v.key : ''))
        .filter(Boolean)
      name = parts.join(' ')
    }

    name = stripPrefixes(name, PLANET_PREFIXES)
    return name.replace(/_/g, ' ')
  }
  return 'Unknown'
}
