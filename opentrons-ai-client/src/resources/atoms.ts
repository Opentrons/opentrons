// jotai's atoms
import { atom } from 'jotai'
import type { ChatData } from './types'

/** ChatDataAtom is for chat data (user prompt and response from OpenAI API) */
export const chatDataAtom = atom<ChatData[]>([])
