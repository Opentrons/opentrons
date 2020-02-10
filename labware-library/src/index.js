// @flow
// labware library entry
import * as React from 'react'
import { hydrate, render } from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import { App } from './components/App'
import { LabwareCreator } from './labware-creator'

import { getPublicPath } from './public-path'
import './styles.global.css'

const $root = document.getElementById('root')

if (!$root) {
  throw new Error('fatal: #root not found')
}

const Root = () => (
  <BrowserRouter>
    <Switch>
      <Route path={`${getPublicPath()}create`} component={LabwareCreator} />
      <Route component={App} />
    </Switch>
  </BrowserRouter>
)

if ($root.hasChildNodes()) {
  hydrate(<Root />, $root)
} else {
  render(<Root />, $root)
}
