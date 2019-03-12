// @flow
// labware library entry
import * as React from 'react'

import './global.css'
import App from './components/App'

render()

export default function render () {
  const $root = document.getElementById('root')

  if (!$root) {
    throw new Error('fatal: #root not found')
  }

  return Promise.all([import('react-dom')]).then(([{default: ReactDom}]) => {
    ReactDom.hydrate(<App />, $root)
  })
}
