// @flow
// static app prerender to string
// inserted into body of index.hbs by prerender-loader
import React from 'react'
import ReactDomServer from 'react-dom/server'
import {StaticRouter, Route} from 'react-router-dom'

import App from './components/App'
import './styles.global.css'

export type PrerenderProps = {
  location: string,
}

export default function prerender (props: PrerenderProps) {
  return `
<div id="root">
  ${ReactDomServer.renderToString(
    <StaticRouter location={props.location} context={{}}>
      <Route component={App} />
    </StaticRouter>
  )}
</div>`.trim()
}
