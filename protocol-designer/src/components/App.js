// @flow
import React from 'react'
import { HashRouter, Route } from 'react-router-dom'

import ConnectedDeckSetup from '../containers/ConnectedDeckSetup'
import About from './About'
import ProtocolEditor from './ProtocolEditor'
import {PortalRoot} from './portals/TopPortal'

import '../css/reset.css'

export default function App () {
  return (
    <HashRouter>
      <div className='container'>
        <Route exact path='/' component={ProtocolEditor} />
        {/* TODO: Ian 2018-06-08 remove these unused routes & their components */}
        <Route exact path='/old-ingredient-selector' component={ConnectedDeckSetup} />
        <Route path='/about' component={About} />
        <PortalRoot />
      </div>
    </HashRouter>
  )
}
