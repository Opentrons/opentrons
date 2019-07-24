// @flow
// static app prerender to string
// inserted into body of index.hbs by prerender-loader
import React from 'react'
import ReactDomServer from 'react-dom/server'
import { StaticRouter, Route, Switch } from 'react-router-dom'

import App from './components/App'
import LabwareCreator from './labware-creator'
import './styles.global.css'

export type PrerenderProps = {
  location: string,
}

export default function prerender(props: PrerenderProps): string {
  return `<div id="root">${ReactDomServer.renderToString(
    <StaticRouter location={props.location} context={{}}>
      <Switch>
        <Route path="/create" component={LabwareCreator} />
        <Route component={App} />
      </Switch>
    </StaticRouter>
  )}</div>`
}
