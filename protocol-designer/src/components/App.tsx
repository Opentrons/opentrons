import * as React from 'react'
import '../css/reset.css'
import { ProtocolEditor } from './ProtocolEditor'

export function App(): JSX.Element {
  return (
    <div className="container">
      <ProtocolEditor />
    </div>
  )
}
