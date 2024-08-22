import { OpenAPIHono as Hono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'

import { HTTPException } from 'hono/http-exception'
import { app as threads } from './threads'
import type { Bindings } from './utils/bindings'
import { reference, specification } from './utils/openapi'

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())
app.use(csrf())
app.use(cors())
app.use(compress({ encoding: 'deflate' }))
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ message: error.message }, error.status)
  }
  return c.json({ message: 'Internal Server Error' }, 500)
})

app.doc('/specification', specification)
app.get('/docs', apiReference(reference))
app.route('/threads', threads)

export default {
  port: 3000,
  fetch: app.fetch
}
