import '../css/reset.css'
import { ProtocolEditor } from './ProtocolEditor'
import * as React from 'react'

export function App(): JSX.Element {
  return (
    <div className="container">
      <ProtocolEditor />
    </div>
  )
}
