import * as sharedData from '@opentrons/shared-data'

import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { App } from './App'

// TODO
window.sharedData = sharedData
console.log('Functions are available under global "sharedData":', sharedData)

const $root = document.getElementById('root')

if (!$root) {
  throw new Error('fatal: :root not found')
}

ReactDOM.render(
  <AppContainer>
    <App />
  </AppContainer>,
  $root
)

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./App', () => {
    ReactDOM.render(
      <AppContainer>
        <App />
      </AppContainer>,
      $root
    )
  })
}
