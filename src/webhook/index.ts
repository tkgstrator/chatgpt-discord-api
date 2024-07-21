import { EventType } from '@/enums/event'
import { PaymentSchema } from '@/models/payment.dto'
import type { UserSchema } from '@/models/user.dto'
import { find, users } from '@/users'
import type { Bindings } from '@/utils/bindings'
import { decode } from '@/utils/decode'
import { Schema as S } from '@effect/schema'
import dayjs from 'dayjs'
import { type Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import Stripe from 'stripe'

export const webhook = new Hono<{ Bindings: Bindings }>()

/**
 * ユーザー情報の取得
 */
webhook.post('/subscribe', async (c: Context<{ Bindings: Bindings }>) => {
  c.executionCtx.waitUntil(verify(c))
  return c.json({})
})

const verify = async (c: Context<{ Bindings: Bindings }>) => {
  const stripe: Stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    typescript: true
  })
  const signature: string | undefined = c.req.header('Stripe-Signature')
  if (signature === undefined) {
    throw new HTTPException(400)
  }
  const payload: string = await c.req.text()
  const event: Stripe.Event = await stripe.webhooks.constructEventAsync(payload, signature, c.env.STRIPE_WEBHOOK_SECRET)
  switch (event.type) {
    // 初回のサブスクリプション作成・チェックアウトで呼ばれる
    case EventType.CHECKOUT_SESSION_COMPLETED:
      await checkout_complete(c, event)
      break
    case EventType.CUSTOMER_SUBSCRIPTION_CREATED:
      await subscription_create(c, event)
      break
    // サブスクリプションキャンセル時に呼ばれる
    case EventType.CUSTOMER_SUBSCRIPTION_DELETED:
      await subscription_delete(c, event)
      break
    // サブスクリプションが変更されたときに呼ばれる
    case EventType.CUSTOMER_SUBSCRIPTION_UPDATED:
      await subscription_update(c, event)
      break
    case EventType.INVOICE_PAYMENT_FAILED:
      break
    // サブスクリプションの支払い成功時に呼ばれる
    case EventType.INVOICE_PAYMENT_SUCCEEDED:
      await payment_success(c, event)
      break
  }
}

const checkout_complete = async (c: Context<{ Bindings: Bindings }>, event: Stripe.CheckoutSessionCompletedEvent) => {
  const subscription: string | Stripe.Subscription | null = event.data.object.subscription
  if (subscription === null) {
    throw new HTTPException(404)
  }
  const data: unknown | null = await c.env.ChatGPT_PaymentData.get(subscription.toString(), { type: 'json' })
  if (data === null) {
    throw new HTTPException(404)
  }
  // @ts-ignore
  const payment: PaymentSchema.Data = decode(PaymentSchema.Data, data).update(event)
  console.log('[UPDATE]', payment)
  // Discordとの連携
  await c.env.ChatGPT_PaymentData.put(payment.subscription_id, JSON.stringify(payment))
  if (payment.discord_user_id === null) {
    throw new HTTPException(400)
  }
  // ユーザーデータを取得
  const user: UserSchema.Data = (await find(c, payment.discord_user_id)).subscribe({
    plan_id: payment.subscription_id,
    expired_in: payment.current_period.end,
    token_limit: payment.token_limit
  })
  await c.env.ChatGPT_UserData.put(user.discord_user_id, JSON.stringify(user))
}

const payment_success = async (c: Context<{ Bindings: Bindings }>, event: Stripe.InvoicePaymentSucceededEvent) => {
  // const subscription: string | Stripe.Subscription | null = event.data.object.subscription
  // if (subscription === null) {
  //   throw new HTTPException(404)
  // }
  // const data: unknown | null = await c.env.ChatGPT_PaymentData.get(subscription.toString(), { type: 'json' })
  // if (data === null) {
  //   throw new HTTPException(404)
  // }
  // // @ts-ignore
  // const payment: PaymentSchema.Data = decode(PaymentSchema.Data, data).update(event)
  // console.log('[UPDATE]', payment, event.type)
  // await c.env.ChatGPT_PaymentData.put(payment.subscription_id, JSON.stringify(payment))
}

const subscription_create = async (c: Context<{ Bindings: Bindings }>, event: Stripe.CustomerSubscriptionCreatedEvent) => {
  const payment: PaymentSchema.Data = PaymentSchema.Data.New(event)
  console.log('[CREATE]', payment, event.type)
  await c.env.ChatGPT_PaymentData.put(payment.subscription_id, JSON.stringify(payment))
}

const subscription_update = async (c: Context<{ Bindings: Bindings }>, event: Stripe.CustomerSubscriptionUpdatedEvent) => {
  const data: unknown | null = await c.env.ChatGPT_PaymentData.get(event.data.object.id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404)
  }
  // @ts-ignore
  const payment: PaymentSchema.Data = decode(PaymentSchema.Data, data).update(event)
  console.log('[UPDATE]', payment, event.type)
  await c.env.ChatGPT_PaymentData.put(payment.subscription_id, JSON.stringify(payment))
}

const subscription_delete = async (c: Context<{ Bindings: Bindings }>, event: Stripe.CustomerSubscriptionDeletedEvent) => {
  const data: unknown | null = await c.env.ChatGPT_PaymentData.get(event.data.object.id, { type: 'json' })
  if (data === null) {
    throw new HTTPException(404)
  }
  // @ts-ignore
  const payment: PaymentSchema.Data = decode(PaymentSchema.Data, data).update(event)
  console.log('[DELETE]', payment, event.type)
}
