// @flow
// labware library entry
import * as React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Route} from 'react-router-dom'

import './public-path'
import './styles.global.css'

// $FlowFixMe: upgrade Flow for React.lazy
// const LazyApp = React.lazy(() => import('./components/App'))
const $root = document.getElementById('root')

if (!$root) {
  throw new Error('fatal: #root not found')
}

import('./components/App').then(({default: App}) => {
  ReactDom.hydrate(
    <BrowserRouter>
      <Route component={App} />
    </BrowserRouter>,
    $root
  )
})
