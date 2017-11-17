import React from 'react'
import { HashRouter, Route } from 'react-router-dom'

import Home from './Home'
import About from './About'

// to clarify: normalize.css is an npm module
// with a dot in its name, not a .css file in src/
import 'normalize.css'

export default function App () {
  return (
    <HashRouter>
      <div className='container'>
        <Route exact path='/' component={Home} />
        <Route path='/about' component={About} />
      </div>
    </HashRouter>
  )
}
