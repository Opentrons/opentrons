import { PDProtocolFile } from './file-types'
import { selectors as loadFileSelectors } from './load-file'
import { loadFileAction } from './load-file/actions'
import { remote } from './shell/remote'

//  TODO(Jr, 1/18/24): use i18n here!
export const initialize = (store: Record<string, any>): void => {
  if (process.env.NODE_ENV === 'production') {
    window.onbeforeunload = (_e: unknown) => {
      // NOTE: the custom text will be ignored in modern browsers
      return loadFileSelectors.getHasUnsavedChanges(store.getState())
        ? 'Are you sure you want to leave? You will lose any unsaved changes.'
        : undefined
    }
  }
  remote.ipcRenderer.on(
    'open-protocol-in-designer',
    (_ipcEvent, protocolSource) => {
      store.dispatch(loadFileAction(protocolSource as PDProtocolFile, true))
    }
  )
}
