import { Model } from '@/enums/model'
import { Role } from '@/enums/role'
import { z } from 'zod'

export const PromptSchema = z.object({
  content: z.string().min(1).openapi({
    example: 'おはようございます'
  }),
  role: z.nativeEnum(Role).openapi({
    example: Role.ASSISTANT
  })
})

export const ThreadSchema = z.object({
  model: z.nativeEnum(Model).openapi({
    example: Model.GPT_4O_MINI
  }),
  thread_id: z.string().openapi({
    example: '1276016528223109174'
  }),
  is_private: z.boolean().openapi({
    example: false
  }),
  discord_user_id: z.string().openapi({
    example: '430364540899819520'
  }),
  prompts: z.array(PromptSchema).openapi({
    example: []
  })
})

export type PromptSchema = z.infer<typeof PromptSchema>
export type ThreadSchema = z.infer<typeof ThreadSchema>
