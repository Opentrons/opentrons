// @flow
import * as React from 'react'
import { ProtocolEditor } from './ProtocolEditor'

import '../css/reset.css'

export function App(): React.Node {
  return (
    <div className="container">
      <ProtocolEditor />
    </div>
  )
}
