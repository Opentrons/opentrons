// @flow
import '../css/reset.css'

import * as React from 'react'

import { ProtocolEditor } from './ProtocolEditor'

export function App(): React.Node {
  return (
    <div className="container">
      <ProtocolEditor />
    </div>
  )
}
