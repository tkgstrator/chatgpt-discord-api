import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'

import { threads } from './threads'
import { users } from './users'
import type { Bindings } from './utils/bindings'
import { webhook } from './webhook'

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())
app.use(csrf())
app.use('*', cors())

app.route('/users', users)
app.route('/threads', threads)
app.route('/webhook', webhook)

export default {
  port: 3000,
  fetch: app.fetch
}
