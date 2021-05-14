// setup modules page
import * as React from 'react'
import { useSelector } from 'react-redux'

import { getConnectedRobot } from '../../redux/discovery'
import { ConnectModules } from './ConnectModules'
import { SessionHeader } from '../../organisms/SessionHeader'

import { Page } from '../../atoms/Page'

export function Modules(): JSX.Element | null {
  const robot = useSelector(getConnectedRobot)
  const robotName = robot?.name || null

  if (robotName === null) {
    return null
  }

  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <ConnectModules robotName={robotName} />
    </Page>
  )
}
