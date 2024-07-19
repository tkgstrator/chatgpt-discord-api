import { Model } from '@/enums/model'
import { Role } from '@/enums/role'
import { Schema as S } from '@effect/schema'

export namespace ChatSchema {
  export const Create = S.Struct({
    discord_user_id: S.String,
    model: S.Enums(Model),
    thread_id: S.String,
    private_thread: S.Boolean,
    joinable: S.Boolean,
    prompts: S.Struct({
      system: S.Array(S.String),
      conversation: S.Array(
        S.Struct({
          role: S.Enums(Role),
          content: S.String
        })
      )
    }),
    estimated_token_used: S.Int
  })

  export const Response = S.Struct({
    discord_user_id: S.String,
    model: S.Enums(Model),
    thread_id: S.String,
    private_thread: S.Boolean,
    joinable: S.Boolean,
    prompts: S.Struct({
      system: S.Array(S.String),
      conversation: S.Array(
        S.Struct({
          role: S.Enums(Role),
          content: S.String
        })
      )
    }),
    estimated_token_used: S.Int
  })
}

export type ChatSchemaResponse = typeof ChatSchema.Response.Type
export type ChatSchemaCreate = typeof ChatSchema.Create.Type
