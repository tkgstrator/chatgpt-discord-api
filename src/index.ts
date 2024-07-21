import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'

import { HTTPException } from 'hono/http-exception'
import { threads } from './threads'
import { users } from './users'
import type { Bindings } from './utils/bindings'
import { webhook } from './webhook'

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())
app.use(csrf())
app.use('*', cors())
// app.onError((error, c) => {
//   console.error(error)
//   if (error instanceof HTTPException) {
//     return c.json({ message: error.message }, error.status)
//   }
//   return c.json({ message: 'Internal Server Error' }, 500)
// })
// app.get(
//   '*',
//   cache({
//     cacheName: 'discord_chat_cache',
//     cacheControl: 'max-age=3600'
//   })
// )

app.route('/users', users)
app.route('/threads', threads)
app.route('/webhook', webhook)

export default {
  port: 3000,
  fetch: app.fetch
}
