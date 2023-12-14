import * as sharedData from '@opentrons/shared-data'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

window.sharedData = sharedData
console.log('Functions are available under global "sharedData":', sharedData)

const container = document.getElementById('root')

if (!container) {
  throw new Error('fatal: #root element not found')
}

const root = ReactDOM.createRoot(container)

root.render(<App />)
