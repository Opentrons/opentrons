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
  scientific_application_type: '',
  description: '',
  robots: 'opentrons_flex',
  mounts: [],
  flexGripper: false,
  modules: [],
  labware: [],
  liquids: [],
  runtime_parameters: '',
  steps: [],
  fake: true,
})

/** CreateProtocolChatAtom is for the prefilled userprompt when navigating to the chat page from Update Protocol page */
export const updateProtocolChatAtom = atom<UpdatePrompt>({
  prompt: '',
  protocol_text: '',
  regenerate: false,
  update_type: 'adapt_python_protocol',
  update_details: '',
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

export const tokenAtom = atom<string | null>(null)

export const mixpanelAtom = atom<Mixpanel | null>({
  analytics: { hasOptedIn: true }, // TODO: set to false when we have the opt-in modal
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

export const displayFeatureFlagsModalAtom = atom<boolean>(false)

// feature flag atoms are a bit more fancy
// they leverage local storage to persist settings across browser refreshes

const DEFAULT_FEATURE_FLAG_STATE = {
  enablePrereleaseMode: false,
  enablePDProtocolGeneration: true,
  enableAnalytics: true,
}

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
      set(displayFeatureFlagsModalAtom, false)
    } else {
      set(rawFeatureFlagsAtom, {
        ...get(rawFeatureFlagsAtom),
        ...update,
      })
    }
  }
)
