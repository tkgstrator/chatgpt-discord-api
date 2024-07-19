import { UserSchema, type UserSchemaCreate } from '@/models/user.dto'
import type { Bindings } from '@/utils/bindings'
import { decode } from '@/utils/decode'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const users = new Hono<{ Bindings: Bindings }>()

/**
 * ユーザー情報の取得
 */
users.get('/:discord_user_id', async (c: Context<{ Bindings: Bindings }>) => {
  const discord_user_id: string = c.req.param('discord_user_id')
  return c.json(await find_user(c, discord_user_id))
})

/**
 * ユーザー情報の作成
 */
users.post('/', async (c: Context<{ Bindings: Bindings }>) => {
  const body: any | null = await c.req.json()
  if (body === null) {
    throw new HTTPException(400, { message: 'Bad request.' })
  }
  // @ts-ignore
  const user: UserSchemaCreate = await decode(UserSchema.Create, body)
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.put(user.discord_user_id, JSON.stringify(user)))
  return c.json(user)
})

/**
 * ユーザー情報の更新
 */
users.patch('/:discord_user_id', async (c: Context<{ Bindings: Bindings }>) => {
  const discord_user_id: string = c.req.param('discord_user_id')
  return c.json(await patch_user(c, discord_user_id))
})

/**
 * ユーザー情報の削除
 */
users.delete('/:discord_user_id', async (c: Context<{ Bindings: Bindings }>) => {
  const discord_user_id: string = c.req.param('discord_user_id')
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.delete(discord_user_id))
  return c.json({ message: 'User deleted.' })
})

/**
 * ユーザー情報の作成
 * @param c
 * @param discord_user_id
 * @returns
 */
const create_user = (c: Context<{ Bindings: Bindings }>, discord_user_id: string): UserSchemaCreate => {
  const user: UserSchemaCreate = UserSchema.New(discord_user_id)
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.put(discord_user_id, JSON.stringify(user)))
  return user
}

/**
 * ユーザー情報の更新
 * @param c
 * @param discord_user_id
 * @returns
 */
const patch_user = async (c: Context<{ Bindings: Bindings }>, discord_user_id: string): Promise<UserSchemaCreate> => {
  const user: UserSchemaCreate = await find_user(c, discord_user_id)
  const body: any | null = await c.req.json()
  // @ts-ignore
  const patch: UserSchemaCreate = { ...user, ...body }
  c.executionCtx.waitUntil(c.env.ChatGPT_UserData.put(discord_user_id, JSON.stringify(patch)))
  return patch
}

/**
 * ユーザー情報の取得
 * @param c
 * @param discord_user_id
 * @returns
 */
const find_user = async (c: Context<{ Bindings: Bindings }>, discord_user_id: string): Promise<UserSchemaCreate> => {
  const data: any | null = await c.env.ChatGPT_UserData.get(discord_user_id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404, { message: 'User not found.' })
  }
  // @ts-ignore
  return await decode(UserSchema.Create, data)
}
