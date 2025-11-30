import { getSave } from '../../../db/save.js'
import type { QueryResolvers } from './../types.generated.js'
export const save: NonNullable<QueryResolvers['save']> = async (
  _parent,
  _arg,
  context,
) => {
  const result = await getSave(context.client, _arg.filename)
  return result === undefined ? null : { ...result, gamestates: [] }
}
