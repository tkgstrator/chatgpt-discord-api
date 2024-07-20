import { ThreadSchema } from '@/models/thread.dto'
import type { Bindings } from '@/utils/bindings'
import { decode } from '@/utils/decode'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const threads = new Hono<{ Bindings: Bindings }>()

threads.get('/:thread_id', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string = c.req.param('thread_id')
  return c.json(await get(c, thread_id))
})

threads.post('', async (c: Context<{ Bindings: Bindings }>) => {
  return c.json(await create(c))
})

threads.patch('/:thread_id/prompts', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string = c.req.param('thread_id')
  return c.json(await add(c, thread_id))
})

threads.delete('/:thread_id', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string = c.req.param('thread_id')
  c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.delete(thread_id))
  return new Response(null, { status: 204 })
})

/**
 * スレッドの取得
 * @param c
 * @returns
 */
const get = async (c: Context<{ Bindings: Bindings }>, thread_id: string): Promise<ThreadSchema.Data> => {
  const data: any | null = await c.env.ChatGPT_ChatData.get(thread_id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404)
  }
  // @ts-ignore
  return decode(ThreadSchema.Data, data)
}

/**
 * スレッドの作成
 * @param c
 * @returns
 */
const create = async (c: Context<{ Bindings: Bindings }>): Promise<ThreadSchema.Data> => {
  const thread: ThreadSchema.Data = ThreadSchema.Data.New(await c.req.json())
  c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.put(thread.thread_id, JSON.stringify(thread)))
  return thread
}

const add = async (c: Context<{ Bindings: Bindings }>, thread_id: string): Promise<ThreadSchema.Data> => {
  // @ts-ignore
  const params: ThreadSchema.MessageParam = decode(ThreadSchema.MessageParam, await c.req.json())
  const thread: ThreadSchema.Data = (await get(c, thread_id)).add(params)
  c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.put(thread.thread_id, JSON.stringify(thread)))
  return thread
}
