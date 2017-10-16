import React from 'react'
import { HashRouter, Route } from 'react-router-dom'

import Home from './Home'
import About from './About'

const App = () => (
  <HashRouter>
    <div className='container'>
      <Route exact path='/' component={Home} />
      <Route path='/about' component={About} />
    </div>
  </HashRouter>
)

export default App
