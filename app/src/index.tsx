/* eslint-disable opentrons/no-imports-across-applications */
// client entry point and application manifest
import ReactDom from 'react-dom/client'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'

import { ApiClientProvider } from '@opentrons/react-api-client'

import { App } from './App'
import { uiInitialized } from './redux/shell'
import { store } from './redux/store'

import '../src/atoms/SoftwareKeyboard/AlphanumericKeyboard'
import '../src/atoms/SoftwareKeyboard/FullKeyboard/index.css'
import '../src/atoms/SoftwareKeyboard/IndividualKey/index.css'
import '../src/atoms/SoftwareKeyboard/NumericalKeyboard/index.css'
import '@opentrons/components/styles/global'

// export public types so they can be accessed by external deps
export * from './redux/types'

// component tree

// kickoff app-shell initializations
store.dispatch(uiInitialized())

console.info('[app/src/index.tsx]: Rendering app UI')

const container = document.getElementById('root')
if (container == null) throw new Error('Failed to find the root element')

const root = ReactDom.createRoot(container)
root.render(
  <Provider store={store}>
    <HashRouter>
      <ApiClientProvider>
        <App />
      </ApiClientProvider>
    </HashRouter>
  </Provider>
)
