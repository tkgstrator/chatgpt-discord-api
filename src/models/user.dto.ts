import { Schema as S } from '@effect/schema'

export namespace UserSchema {
  export const Create = S.Struct({
    discord_user_id: S.String,
    subscription: S.Struct({
      plan_id: S.NullOr(S.String),
      remaining_token: S.Struct({
        prompt: S.Int,
        completion: S.Int
      }),
      expired_in: S.NullOr(S.Date)
    })
  })

  export const Patch = S.Struct({
    subscription: S.Struct({
      plan_id: S.NullishOr(S.String),
      remaining_token: S.Struct({
        prompt: S.Int,
        completion: S.Int
      }),
      expired_in: S.NullishOr(S.Date)
    })
  })

  export const New = (discord_user_id: string): UserSchemaCreate => {
    return {
      discord_user_id: discord_user_id,
      subscription: {
        plan_id: null,
        remaining_token: {
          prompt: 1000000,
          completion: 1000000
        },
        expired_in: null
      }
    }
  }
}

export type UserSchemaCreate = typeof UserSchema.Create.Type
export type UserSchemaUpdate = typeof UserSchema.Update.Type
