// jotai's atoms
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import type {
  Chat,
  ChatData,
  CreatePrompt,
  CreateProtocolAtomProps,
  FeatureFlags,
  HeaderWithMeterAtomProps,
  Mixpanel,
  UpdatePrompt,
} from './types'

/** ChatDataAtom is for chat data (user prompt and response from OpenAI API) */
export const chatDataAtom = atom<ChatData[]>([])

/** CreateProtocolChatAtom is for the prefilled userprompt when navigating to the chat page from Create New protocol page */
export const createProtocolChatAtom = atom<CreatePrompt>({
  prompt: '',
  regenerate: false,
  scientificApplicationType: '',
  description: '',
  robots: 'opentrons_flex',
  mounts: [],
  flexGripper: false,
  modules: [],
  labware: [],
  liquids: [],
  runtimeParameters: '',
  steps: [],
  fake: true,
})

/** CreateProtocolChatAtom is for the prefilled userprompt when navigating to the chat page from Update Protocol page */
export const updateProtocolChatAtom = atom<UpdatePrompt>({
  prompt: '',
  protocolText: '',
  regenerate: false,
  updateType: 'adapt_python_protocol',
  updateDetails: '',
  fake: false,
})

/** Regenerate protocol atom */
export const regenerateProtocolAtom = atom<{
  isCreateOrUpdateProtocol: boolean
  regenerate: boolean
}>({
  isCreateOrUpdateProtocol: false,
  regenerate: false,
})

/** Scroll to bottom of chat atom */
export const scrollToBottomAtom = atom<boolean>(false)

export const chatHistoryAtom = atom<Chat[]>([])

export const feedbackModalAtom = atom<boolean>(false)

/** Tracks whether the authenticated user has verified their email address.
 * null = not yet determined, true = verified, false = unverified. */
export const emailVerifiedAtom = atom<boolean | null>(null)

// feature flag atoms are a bit more fancy
// they leverage local storage to persist settings across browser refreshes

const DEFAULT_FEATURE_FLAG_STATE = {
  enablePrereleaseMode: false,
  enableAnalytics: true,
}

export const mixpanelAtom = atom<Mixpanel | null>({
  analytics: { hasOptedIn: DEFAULT_FEATURE_FLAG_STATE.enableAnalytics },
  isInitialized: false,
})

export const headerWithMeterAtom = atom<HeaderWithMeterAtomProps>({
  displayHeaderWithMeter: false,
  progress: 0,
})

export const createProtocolAtom = atom<CreateProtocolAtomProps>({
  currentSection: 0,
  focusSection: 0,
})

export const displayExitConfirmModalAtom = atom<boolean>(false)

const rawFeatureFlagsAtom = atomWithStorage<FeatureFlags>(
  'opentrons_ai_feature_flags',
  { ...DEFAULT_FEATURE_FLAG_STATE }
)

export const featureFlagsAtom = atom(
  get => get(rawFeatureFlagsAtom),
  (get, set, update: Partial<FeatureFlags>) => {
    // reset all feature flags to false if turning off prerelease mode
    if (update.enablePrereleaseMode === false) {
      set(rawFeatureFlagsAtom, { ...DEFAULT_FEATURE_FLAG_STATE })
    } else {
      set(rawFeatureFlagsAtom, {
        ...get(rawFeatureFlagsAtom),
        ...update,
      })
    }
  }
)
