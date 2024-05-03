// jotai's atoms
import { atom } from 'jotai'
import type { ChatData } from './types'

/** preparedPromptAtom is for PromptButton */
export const preparedPromptAtom = atom<string>('')

/** ChatDataAtom is for chat data (user prompt and response from OpenAI API) */
export const chatDataAtom = atom<ChatData[]>([])
