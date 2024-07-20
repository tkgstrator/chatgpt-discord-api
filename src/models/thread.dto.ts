import { Model } from '@/enums/model'
import { Role } from '@/enums/role'
import { Schema as S } from '@effect/schema'
import type OpenAI from 'openai'

export namespace ThreadSchema {
  export class MessageParam extends S.Class<MessageParam>('MessageParam')({
    system: S.Array(
      S.Struct({
        role: S.Enums(Role),
        content: S.String
      })
    ),
    conversation: S.Array(
      S.Struct({
        role: S.Enums(Role),
        content: S.String
      })
    )
  }) {
    /**
     * OpenAIのChatCompletionMessageParamに変換
     */
    get messages(): OpenAI.ChatCompletionMessageParam[] {
      return this.system
        .map((prompt) => {
          return {
            role: prompt.role,
            content: prompt.content
          }
        })
        .concat(
          this.conversation.map((prompt) => {
            return {
              role: prompt.role,
              content: prompt.content
            }
          })
        )
    }
  }

  export class Data extends S.Class<Data>('Data')({
    discord_user_id: S.String,
    model: S.Enums(Model),
    thread_id: S.String,
    private_thread: S.Boolean,
    joinable: S.Boolean,
    prompts: MessageParam,
    estimated_token_used: S.Int
  }) {
    /**
     * データを上書きする
     * @param params
     * @returns
     */
    update(params: Partial<ThreadSchema.Data>): ThreadSchema.Data {
      return new ThreadSchema.Data({ ...this, ...params })
    }

    /**
     * プロンプトを追加する
     * @param params
     * @returns
     */
    add(params: ThreadSchema.MessageParam): ThreadSchema.Data {
      return this.update({
        prompts: new ThreadSchema.MessageParam({
          system: this.prompts.system.concat(params.system),
          conversation: this.prompts.conversation.concat(params.conversation)
        })
      })
    }

    /**
     * コンストラクタ
     * @param params
     * @returns
     */
    static New(body: any): ThreadSchema.Data {
      return new ThreadSchema.Data({
        discord_user_id: body.discord_user_id,
        model: Model.GPT_4O_MINI,
        thread_id: body.thread_id,
        private_thread: false,
        joinable: true,
        prompts: new MessageParam({
          system: [],
          conversation: []
        }),
        estimated_token_used: 0
      })
    }
  }
}
