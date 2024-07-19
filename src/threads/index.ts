import { ThreadSchema, type ThreadSchemaCreate } from '@/models/thread.dto'
import type { Bindings } from '@/utils/bindings'
import { decode } from '@/utils/decode'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const threads = new Hono<{ Bindings: Bindings }>()

threads.get('/:thread_id', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string = c.req.param('thread_id')
  return c.json(await find_thread(c, thread_id))
})

threads.post('', async (c: Context<{ Bindings: Bindings }>) => {
  const body: any | null = await c.req.json()
  if (body === null) {
    throw new HTTPException(400, { message: 'Bad request.' })
  }
  try {
    // @ts-ignore
    const thread: ThreadSchemaCreate = await decode(ThreadSchema.Create, body)
    c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.put(thread.thread_id, JSON.stringify(thread)))
    return c.json(thread)
  } catch {
    throw new HTTPException(400, { message: 'Bad request.' })
  }
})

threads.patch('/:thread_id', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string = c.req.param('thread_id')
  return c.json(await patch_thread(c, thread_id))
})

threads.delete('/:thread_id', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string = c.req.param('thread_id')
  c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.delete(thread_id))
  return c.json({ message: 'Thread deleted.' })
})

const patch_thread = async (c: Context<{ Bindings: Bindings }>, thread_id: string): Promise<ThreadSchemaCreate> => {
  const user: ThreadSchemaCreate = await find_thread(c, thread_id)
  const body: any | null = await c.req.json()
  // @ts-ignore
  const patch: ThreadSchemaCreate = { ...user, ...body }
  c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.put(thread_id, JSON.stringify(patch)))
  return patch
}

/**
 * スレッド情報の取得
 * @param c
 * @param discord_user_id
 * @returns
 */
const find_thread = async (c: Context<{ Bindings: Bindings }>, thread_id: string): Promise<ThreadSchemaCreate> => {
  const data: any | null = await c.env.ChatGPT_ChatData.get(thread_id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404, { message: 'Thread not found.' })
  }
  return await decode(ThreadSchema.Create, data)
}
