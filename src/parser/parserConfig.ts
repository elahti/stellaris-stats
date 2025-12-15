import z from 'zod/v4'

export const ParserConfig = z.object({
  STELLARIS_STATS_PARSER_INTERVAL: z.coerce.number(),
})
