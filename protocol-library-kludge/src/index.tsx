import * as React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

const container = document.getElementById('root')

if (container == null) throw new Error('Failed to find the root element')
const root = ReactDOM.createRoot(container)

root.render(<App />)
