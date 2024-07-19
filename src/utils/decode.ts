import { Schema as S } from '@effect/schema'

export const decode = async <T>(schema: S.Schema<T>, data: any): Promise<T> => {
  const decoder = S.decodePromise(schema)
  return await decoder(data)
}
