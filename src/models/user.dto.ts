import { decode } from '@/utils/decode'
import { Schema as S } from '@effect/schema'
import { textChangeRangeIsUnchanged } from 'typescript'

export namespace UserSchema {
  export class Token extends S.Class<Token>('Token')({
    prompt: S.Struct({
      limit: S.Int,
      usage: S.Int
    }),
    completion: S.Struct({
      limit: S.Int,
      usage: S.Int
    })
  }) {}

  export class Subscription extends S.Class<Subscription>('Subscription')({
    plan_id: S.NullOr(S.String),
    token: Token,
    expired_in: S.NullOr(S.String)
  }) {
    /**
     * 利用可能かどうか
     */
    get available(): boolean {
      return this.token.prompt.limit > this.token.prompt.usage && this.token.completion.limit > this.token.completion.usage
    }
  }

  // export class Plan extends S.Class<Plan>('Plan')({
  //   plan_id: S.NullOr(S.String),
  //   expired_in: S.NullOr(S.Date)
  // }) {}

  export class Usage extends S.Class<Usage>('Usage')({
    prompt: S.Int.pipe(S.greaterThan(0)),
    completion: S.Int.pipe(S.greaterThan(0))
  }) {}

  export class Data extends S.Class<Data>('Data')({
    discord_user_id: S.String,
    subscription: Subscription
  }) {
    /**
     * サブスクリプションデータの更新
     * @param params
     * @returns
     */
    update(
      subscription: Partial<{
        plan_id: string | null
        token: {
          prompt: {
            limit: number
            usage: number
          }
          completion: {
            limit: number
            usage: number
          }
        }
        expired_in: string | null
      }>
    ): UserSchema.Data {
      return new UserSchema.Data(
        // @ts-ignore
        decode(UserSchema.Data, {
          ...this,
          subscription: {
            ...this.subscription,
            ...JSON.parse(JSON.stringify(subscription))
          }
        })
      )
    }

    /**
     * トークンを消費する
     * @param params
     * @returns
     */
    use(usage: UserSchema.Usage): UserSchema.Data {
      return this.update({
        token: {
          prompt: {
            limit: this.subscription.token.prompt.limit,
            usage: this.subscription.token.prompt.usage + usage.prompt
          },
          completion: {
            limit: this.subscription.token.completion.limit,
            usage: this.subscription.token.completion.usage + usage.completion
          }
        }
      })
    }

    /**
     * サブスクリプションを購読する
     * @param subscription
     * @returns
     */
    subscribe(params: { plan_id: string; expired_in: string; token_limit: number }): UserSchema.Data {
      return this.update({
        plan_id: params.plan_id,
        token: {
          prompt: {
            limit: params.token_limit,
            usage: this.subscription.token.prompt.usage
          },
          completion: {
            limit: params.token_limit,
            usage: this.subscription.token.completion.usage
          }
        },
        expired_in: params.expired_in
      })
    }

    /**
     * コンストラクタ
     * @param discord_user_id
     * @returns
     */
    static New(body: any): UserSchema.Data {
      return new UserSchema.Data({
        discord_user_id: decode(
          S.Struct({
            discord_user_id: S.String
          }),
          body
        ).discord_user_id,
        subscription: new UserSchema.Subscription({
          plan_id: null,
          token: new Token({
            prompt: {
              limit: 1000000,
              usage: 0
            },
            completion: {
              limit: 1000000,
              usage: 0
            }
          }),
          expired_in: null
        })
      })
    }
  }
}

export type UserSchemaType = typeof UserSchema.Data.Type
