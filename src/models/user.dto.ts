import { decode } from '@/utils/decode'
import { Schema as S } from '@effect/schema'

export namespace UserSchema {
  export class Subscription extends S.Class<Subscription>('Subscription')({
    plan_id: S.NullOr(S.String),
    remaining_token: S.Struct({
      prompt: S.Int.pipe(S.greaterThan(0)),
      completion: S.Int.pipe(S.greaterThan(0))
    }),
    expired_in: S.NullOr(S.Date)
  }) {}

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
     * データを上書きする
     * @param params
     * @returns
     */
    update(params: Partial<UserSchema.Data>): UserSchema.Data {
      // @ts-ignore
      return new UserSchema.Data(decode(UserSchema.Data, { ...this, ...params }))
    }

    /**
     * トークンを消費する
     * @param params
     * @returns
     */
    use(usage: UserSchema.Usage): UserSchema.Data {
      return this.update({
        subscription: {
          ...this.subscription,
          remaining_token: {
            prompt: this.subscription.remaining_token.prompt - usage.prompt,
            completion: this.subscription.remaining_token.completion - usage.completion
          }
        }
      })
    }

    /**
     * サブスクリプションを購読する
     * @param subscription
     * @returns
     */
    subscribe(subscription: { plan_id: string; expired_in: Date }): UserSchema.Data {
      return this.update({ ...this, ...subscription })
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
          remaining_token: {
            prompt: 1000000,
            completion: 1000000
          },
          expired_in: null
        })
      })
    }
  }
}

export type UserSchemaType = typeof UserSchema.Data.Type
