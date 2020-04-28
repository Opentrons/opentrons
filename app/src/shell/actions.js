// @flow

import type { UiInitializedAction } from './types'

export const UI_INITIALIZED: 'shell:UI_INITIALIZED' = 'shell:UI_INITIALIZED'

export const uiInitialized = (): UiInitializedAction => ({
  type: UI_INITIALIZED,
  meta: { shell: true },
})
