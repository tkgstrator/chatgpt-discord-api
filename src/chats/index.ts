import type { Bindings } from '@/utils/bindings'
import { Hono } from 'hono'

export const chats = new Hono<{ Bindings: Bindings }>()
