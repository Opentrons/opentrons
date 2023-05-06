import React, { useState } from 'react'
import '../css/reset.css'
import { selectPageForms } from './FlexProtocolEditor/constant'
import { selectRobotPage } from './LandingPage'

export function App(): JSX.Element {
  const [page, setPage] = useState(selectPageForms.defaultLandingPage)
  return <div className="container">{selectRobotPage(page, setPage)}</div>
}
