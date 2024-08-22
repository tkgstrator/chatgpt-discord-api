import { HTTPMethod } from '@/enums/method'
import { Model } from '@/enums/model'
import { PromptSchema, ThreadSchema } from '@/models/thread.dto'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const app = new Hono<{ Bindings: Bindings }>()

const create_thread = (c: Context<{ Bindings: Bindings }>, params: ThreadSchema): ThreadSchema => {
  c.executionCtx.waitUntil(c.env.ChatGPT_Thread.put(params.thread_id, JSON.stringify(params)))
  return params
}

const update_thread = (c: Context<{ Bindings: Bindings }>, params: ThreadSchema, prompt: PromptSchema): ThreadSchema => {
  params.prompts = [...params.prompts, ...[prompt]]
  c.executionCtx.waitUntil(c.env.ChatGPT_Thread.put(params.thread_id, JSON.stringify(params)))
  return params
}

const upsert_thread = async (
  c: Context<{ Bindings: Bindings }>,
  thread_id: string,
  discord_user_id: string,
  prompt: PromptSchema
): Promise<ThreadSchema> => {
  try {
    const thread: ThreadSchema = await get_thread(c, thread_id)
    return update_thread(c, thread, prompt)
  } catch (error) {
    return create_thread(
      c,
      ThreadSchema.parse({
        model: Model.GPT_4O_MINI,
        thread_id,
        is_private: false,
        discord_user_id,
        prompts: [prompt]
      })
    )
  }
}

const get_thread = async (c: Context<{ Bindings: Bindings }>, thread_id: string): Promise<ThreadSchema> => {
  const data: object | null = await c.env.ChatGPT_Thread.get(thread_id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404, { message: 'Not Found' })
  }
  return ThreadSchema.parse(data)
}

const get_threads = async (c: Context<{ Bindings: Bindings }>, limit: number): Promise<ThreadSchema[]> => {
  const keys: string[] = (await c.env.ChatGPT_Thread.list({ limit })).keys.map((key) => key.name)
  console.log(keys)
  return (await Promise.allSettled(keys.map((key) => get_thread(c, key))))
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<ThreadSchema>).value)
}

const delete_thread = async (c: Context<{ Bindings: Bindings }>, thread_id: string): Promise<ThreadSchema> => {
  c.executionCtx.waitUntil(c.env.ChatGPT_Thread.delete(thread_id))
  return get_thread(c, thread_id)
}

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    tags: ['スレッド'],
    summary: 'スレッド一覧',
    request: {
      query: z.object({
        limit: z.number().min(1).max(100).optional().default(10)
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.array(ThreadSchema)
          }
        },
        type: 'application/json',
        description: 'スレッド一覧'
      }
    }
  }),
  async (c) => {
    return c.json(await get_threads(c, c.req.valid('query').limit))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.PATCH,
    path: '/{thread_id}',
    tags: ['スレッド'],
    summary: 'スレッド更新',
    request: {
      params: z.object({
        thread_id: z.string()
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              discord_user_id: z.string(),
              prompt: PromptSchema
            })
          }
        }
      }
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ThreadSchema
          }
        },
        type: 'application/json',
        description: 'スレッド詳細'
      },
      400: {
        description: 'Bad Request'
      }
    }
  }),
  async (c) => {
    const thread_id: string = c.req.valid('param').thread_id
    const discord_user_id: string = c.req.valid('json').discord_user_id
    const prompt = PromptSchema.parse(c.req.valid('json').prompt)
    return c.json(await upsert_thread(c, thread_id, discord_user_id, prompt))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/',
    tags: ['スレッド'],
    summary: 'スレッド作成',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ThreadSchema
          }
        }
      }
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ThreadSchema
          }
        },
        type: 'application/json',
        description: 'スレッド詳細'
      },
      400: {
        description: 'Bad Request'
      }
    }
  }),
  async (c) => {
    return c.json(create_thread(c, c.req.valid('json')))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{thread_id}',
    tags: ['スレッド'],
    summary: 'スレッド詳細',
    request: {
      params: z.object({
        thread_id: z.string()
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ThreadSchema
          }
        },
        type: 'application/json',
        description: 'スレッド詳細'
      }
    }
  }),
  async (c) => {
    return c.json(await get_thread(c, c.req.valid('param').thread_id))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.DELETE,
    path: '/{thread_id}',
    tags: ['スレッド'],
    summary: 'スレッド詳細',
    request: {
      params: z.object({
        thread_id: z.string()
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ThreadSchema
          }
        },
        type: 'application/json',
        description: 'スレッド詳細'
      }
    }
  }),
  async (c) => {
    return c.json(await delete_thread(c, c.req.valid('param').thread_id))
  }
)
