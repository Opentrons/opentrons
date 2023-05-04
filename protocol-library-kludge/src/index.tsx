import { App } from './App'
import * as React from 'react'
import ReactDOM from 'react-dom'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Unable to find #root')
}

ReactDOM.render(<App />, root)
