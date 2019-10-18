// @flow
// attached modules container card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Card, useInterval } from '@opentrons/components'
import { fetchModules, getModulesState } from '../../robot-api'
import ModulesCardContents from './ModulesCardContents'

import type { State, Dispatch } from '../../types'
import type { Robot } from '../../discovery'

type Props = {| robot: Robot |}

const TITLE = 'Modules'
const POLL_MODULE_INTERVAL_MS = 5000

export default function AttachedModulesCard(props: Props) {
  const { robot } = props
  const dispatch = useDispatch<Dispatch>()

  const modules = useSelector((state: State) =>
    getModulesState(state, robot.name)
  )

  // this component may be mounted if the robot is not currently connected, so
  // GET /modules ourselves instead of relying on the poll while connected epic
  useInterval(
    () => dispatch(fetchModules(robot)),
    POLL_MODULE_INTERVAL_MS,
    true
  )

  return (
    <Card title={TITLE}>
      <ModulesCardContents robot={robot} modules={modules} />
    </Card>
  )
}
