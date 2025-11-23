import { getSaves } from '@stellaris-stats/shared/save'
import type { QueryResolvers, Save } from './../types.generated.js'
export const saves: NonNullable<QueryResolvers['saves']> = async (
  _parent,
  _arg,
  context,
) =>
  (await getSaves(context.client)).map<Save>((save) => ({
    ...save,
    gamestates: [],
  }))
