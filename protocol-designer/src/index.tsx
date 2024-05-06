import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'

import { configureStore } from './configureStore'
import { App } from './components/App'
import { initialize } from './initialize'
import { initializeMixpanel } from './analytics/mixpanel'
import { i18n } from './localization'

import type { Remote } from './types'
import { remove } from 'lodash'



// initialize Redux
const store = configureStore()
initialize(store)

// initialize analytics
initializeMixpanel(store.getState())

const container = document.getElementById('root')
if (container == null) throw new Error('Failed to find the root element')
const root = ReactDOM.createRoot(container)

const render = (Component: any): void => {
  root.render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </Provider>
  )
}



const emptyRemote: Remote = {} as any

export const remote: Remote = new Proxy(emptyRemote, {
  get(_target, propName: string): unknown {
    console.assert(
      (global as any).APP_SHELL_REMOTE,
      'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.ts properly configured?'
    )

    console.assert(
      propName in (global as any).APP_SHELL_REMOTE,
      `Expected APP_SHELL_REMOTE.${propName} to exist, is app-shell/src/preload.ts properly configured?`
    )
    return (global as any).APP_SHELL_REMOTE[propName] as Remote
  },
})

// Instantiate the notify listener at runtime.
remote.ipcRenderer.on(
  'set-protocol-source-file',
  (...params) => {
    console.log('GOT IPC MESSAGE', params)
  }
)

render(App)
