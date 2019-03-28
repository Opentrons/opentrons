// @flow
// labware library entry
import * as React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Route} from 'react-router-dom'

import App from './components/App'
import './styles.global.css'

render()

export default function render () {
  const $root = document.getElementById('root')

  if (!$root) {
    throw new Error('fatal: #root not found')
  }

  ReactDom.hydrate(
    <BrowserRouter>
      <Route component={App} />
    </BrowserRouter>,
    $root
  )
}
