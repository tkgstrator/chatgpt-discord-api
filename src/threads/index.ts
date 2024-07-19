import { ChatSchema, type ChatSchemaCreate, ChatSchemaResponse } from '@/models/chat.dto'
import type { Bindings } from '@/utils/bindings'
import { Schema as S } from '@effect/schema'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const threads = new Hono<{ Bindings: Bindings }>()

threads.get('/:thread_id', async (c: Context<{ Bindings: Bindings }>) => {
  const thread_id: string | undefined = c.req.param('thread_id')
  if (thread_id === undefined) {
    throw new HTTPException(400, { message: 'Thread ID is required.' })
  }
  try {
    BigInt(thread_id)
  } catch {
    throw new HTTPException(400, { message: 'Invalid Thread ID.' })
  }
  const data: string | null = await c.env.ChatGPT_ChatData.get(thread_id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404, { message: 'Thread not found.' })
  }
  return c.json(data)
})

threads.post('', async (c: Context<{ Bindings: Bindings }>) => {
  const body: any = await c.req.json()
  const decoder = S.decodePromise(ChatSchema.Create)
  const params: ChatSchemaCreate = await decoder(body)
  c.executionCtx.waitUntil(c.env.ChatGPT_ChatData.put(params.thread_id, JSON.stringify(params)))
  return c.json(params)
})
