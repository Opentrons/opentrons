// jotai's atoms
import { atom } from 'jotai'
import type { Chat, ChatData } from './types'

/** ChatDataAtom is for chat data (user prompt and response from OpenAI API) */
export const chatDataAtom = atom<ChatData[]>([])

export const chatHistoryAtom = atom<Chat[]>([])

export const tokenAtom = atom<string | null>(null)
