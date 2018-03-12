// @flow
import React from 'react'
import { HashRouter, Route } from 'react-router-dom'

import ConnectedDeckSetup from '../containers/ConnectedDeckSetup'
import About from './About'
import ProtocolEditor from './ProtocolEditor'

// to clarify: normalize.css is an npm module
// with a dot in its name, not a .css file in src/
import 'normalize.css'
import '../css/globals.css'

// TODO: remove this, for DEBUGGING only
import * as labwareDefs from '@opentrons/labware-definitions'
window.labwareDefs = labwareDefs

export default function App () {
  return (
    <HashRouter>
      <div className='container'>
        <Route exact path='/' component={ProtocolEditor} />
        <Route exact path='/old-ingredient-selector' component={ConnectedDeckSetup} />
        <Route path='/about' component={About} />
      </div>
    </HashRouter>
  )
}
