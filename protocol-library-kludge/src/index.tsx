import * as React from 'react'
import ReactDOM from 'react-dom'
import { App } from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Unable to find #root element')
}

const root = ReactDOM.createRoot(container)

root.render(<App />)
