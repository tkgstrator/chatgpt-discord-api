import { Schema as S } from '@effect/schema'
import { HTTPException } from 'hono/http-exception'

export const decode = <T>(schema: S.SchemaClass<T>, data: any): T => {
  const decoder = S.decodeEither(schema)
  const result = decoder(data)
  if (result._tag === 'Left') {
    throw new HTTPException(400)
  }
  return result.right
}
