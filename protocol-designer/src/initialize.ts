import { i18n } from './localization'
import { selectors as loadFileSelectors } from './load-file'

export const initialize = (store: Record<string, any>): void => {
  if (process.env.NODE_ENV === 'production') {
    window.onbeforeunload = (_e: unknown) => {
      // NOTE: the custom text will be ignored in modern browsers
      return loadFileSelectors.getHasUnsavedChanges(store.getState())
        ? i18n.t('alert.window.confirm_leave')
        : undefined
    }
  }
}
