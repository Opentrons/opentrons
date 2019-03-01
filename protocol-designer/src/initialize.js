// @flow

import i18n from './localization'
import {selectors as loadFileSelectors} from './load-file'
import {selectors as analyticsSelectors} from './analytics'
import {initializeAnalytics} from './analytics/integrations'

const initialize = (store: Object) => {
  if (process.env.NODE_ENV === 'production') {
    window.onbeforeunload = (e) => {
      // NOTE: the custom text will be ignored in modern browsers
      return loadFileSelectors.getHasUnsavedChanges(store.getState()) ? i18n.t('alert.window.confirm_leave') : undefined
    }

    // TODO: Immediately get qs params
    const token = null // getToken()
    if (token) {
      const payload = {email: '', name: ''}// decryptToken(token)
      if (payload) {
        // writeCookie(payload)
        // permit entrance
      }
    } else {
      // launch blocking modal
    }

    // Initialize analytics if user has already opted in
    if (analyticsSelectors.getHasOptedIn(store.getState())) {
      initializeAnalytics()
    }
  }
}

export default initialize
