import { PoolClient } from 'pg'
import { selectRows } from '../db.js'
import { Save, SaveSchema } from '../graphql/generated/validation.generated.js'

const getSavesQuery = `
SELECT
  s.save_id AS save_id,
  s.filename AS filename,
  s.name AS name
FROM
  save s
`

export const getSaves = (
  client: PoolClient,
): Promise<Pick<Save, 'saveId' | 'filename' | 'name'>[]> =>
  selectRows(
    () => client.query(getSavesQuery, []),
    SaveSchema().pick({ saveId: true, filename: true, name: true }),
  )

const getSaveQuery = `
SELECT
  s.save_id AS save_id,
  s.filename AS filename,
  s.name AS name
FROM
  save s
WHERE
  s.filename = $1
`

export const getSave = async (
  client: PoolClient,
  filename: string,
): Promise<Pick<Save, 'saveId' | 'filename' | 'name'> | undefined> => {
  const results = await selectRows(
    () => client.query(getSaveQuery, [filename]),
    SaveSchema().pick({ saveId: true, filename: true, name: true }),
  )
  return results[0]
}
