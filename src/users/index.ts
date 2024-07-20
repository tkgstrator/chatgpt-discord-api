import { UserSchema } from '@/models/user.dto'
import type { Bindings } from '@/utils/bindings'
import { decode } from '@/utils/decode'
import { Schema as S } from '@effect/schema'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const users = new Hono<{ Bindings: Bindings }>()

/**
 * ユーザー情報の取得
 */
users.get('/:discord_user_id', async (c: Context<{ Bindings: Bindings }>) => {
  const discord_user_id: string = c.req.param('discord_user_id')
  return c.json(await find(c, discord_user_id))
})

/**
 * ユーザー情報の作成
 */
users.post('/', async (c: Context<{ Bindings: Bindings }>) => {
  const user: UserSchema.Data = await create(c)
  return c.json(user)
})

/**
 * ユーザー情報の更新
 */
users.patch('/:discord_user_id/usage', async (c: Context<{ Bindings: Bindings }>) => {
  const discord_user_id: string = c.req.param('discord_user_id')
  return c.json(await usage(c, discord_user_id))
})

/**
 * ユーザー情報の削除
 */
users.delete('/:discord_user_id', async (c: Context<{ Bindings: Bindings }>) => {
  const discord_user_id: string = c.req.param('discord_user_id')
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.delete(discord_user_id))
  return new Response(null, { status: 204 })
})

/**
 * ユーザー情報の取得
 * @param c
 * @param discord_user_id
 * @returns
 */
const find = async (c: Context<{ Bindings: Bindings }>, discord_user_id: string): Promise<UserSchema.Data> => {
  const data: any | null = await c.env.ChatGPT_UserData.get(discord_user_id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404)
  }
  // @ts-ignore
  return decode(UserSchema.Data, data)
}

/**
 * ユーザー情報の作成
 * @param c
 * @param discord_user_id
 * @returns
 */
const create = async (c: Context<{ Bindings: Bindings }>): Promise<UserSchema.Data> => {
  // @ts-ignore
  const user: UserSchema.Data = UserSchema.Data.New(await c.req.json())
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.put(user.discord_user_id, JSON.stringify(user)))
  return user
}

/**
 * ユーザー情報の更新
 * 更新はバックグラウンドで行うのではなく、反映したデータを待ってからレスポンスを返す
 * @param c
 * @param discord_user_id
 * @returns
 */
const usage = async (c: Context<{ Bindings: Bindings }>, discord_user_id: string): Promise<Partial<UserSchema.Data>> => {
  // @ts-ignore
  const usage: UserSchema.Usage = decode(UserSchema.Usage, await c.req.json())
  const user: UserSchema.Data = (await find(c, discord_user_id)).use(usage)
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.put(discord_user_id, JSON.stringify(user)))
  return user
}
