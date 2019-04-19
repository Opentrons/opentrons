// @flow
// labware library entry
import * as React from 'react'
import ReactDom from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import './public-path'
import './styles.global.css'

const $root = document.getElementById('root')

if (!$root) {
  throw new Error('fatal: #root not found')
}

import('./components/App').then(({ default: App }) => {
  // TODO(mc, 2019-04-08): switch to hydrate after figuring out reconcilliation
  // when filters are active
  ReactDom.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    $root
  )
})
