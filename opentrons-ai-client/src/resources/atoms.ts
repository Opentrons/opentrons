// jotai's atoms
import { atom } from 'jotai'
import type { Chat, ChatData } from './types'

/** preparedPromptAtom is for PromptButton */
export const preparedPromptAtom = atom<string>('')

/** ChatDataAtom is for chat data (user prompt and response from OpenAI API) */
export const chatDataAtom = atom<ChatData[]>([])

export const chatHistoryAtom = atom<Chat[]>([])

export const tokenAtom = atom<string | null>(null)
