import * as React from 'react'
import { ProtocolEditor } from './ProtocolEditor'

import '../css/reset.module.css'

export function App(): JSX.Element {
  return (
    <div className="container">
      <ProtocolEditor />
    </div>
  )
}
