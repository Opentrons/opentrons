// @flow

import i18n from './localization'
import { selectors as loadFileSelectors } from './load-file'
import { selectors as analyticsSelectors } from './analytics'
import { initializeFullstory } from './analytics/fullstory'

const initialize = (store: Object) => {
  if (process.env.NODE_ENV === 'production') {
    window.onbeforeunload = e => {
      // NOTE: the custom text will be ignored in modern browsers
      return loadFileSelectors.getHasUnsavedChanges(store.getState())
        ? i18n.t('alert.window.confirm_leave')
        : undefined
    }

    // Initialize analytics if user has already opted in
    if (analyticsSelectors.getHasOptedIn(store.getState())) {
      initializeFullstory()
    }
  }
}

export default initialize
