// @flow
// labware library entry
import * as React from 'react'
import ReactDom from 'react-dom'

import App from './components/App'
import './styles.global.css'

render()

export default function render () {
  const $root = document.getElementById('root')

  if (!$root) {
    throw new Error('fatal: #root not found')
  }

  // TODO(mc, 2019-03-14) import('./components/App') breaks the build;
  // investigate and potentially try to find other split points. For now don't
  // explicitely bundle split
  ReactDom.hydrate(<App />, $root)
}
