// @flow
// attached modules container card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Card, useInterval } from '@opentrons/components'
import {
  fetchModules,
  getAttachedModules,
  getModuleControlsDisabled,
} from '../../../redux/modules'
import { getConnectedRobotName } from '../../../redux/robot/selectors'
import { ModuleItem, NoModulesMessage } from './ModuleItem'

import type { State, Dispatch } from '../../../redux/types'

type Props = {| robotName: string |}

// TODO(bc, 2021-02-16): i18n

const TITLE = 'Modules'
const POLL_MODULE_INTERVAL_MS = 5000

export function AttachedModulesCard(props: Props): React.Node {
  const { robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const connectedRobotName = useSelector(getConnectedRobotName)
  const modules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )
  const controlDisabledReason = useSelector((state: State) =>
    getModuleControlsDisabled(state, robotName)
  )

  // if robot is connected, the modules epic will poll /modules automatically,
  // but we need to poll ourselves if we're viewing this robot without
  // connecting to its RPC server
  useInterval(
    () => dispatch(fetchModules(robotName)),
    connectedRobotName === null ? POLL_MODULE_INTERVAL_MS : null,
    true
  )

  return (
    <Card title={TITLE}>
      {modules.length === 0 ? (
        <NoModulesMessage />
      ) : (
        modules.map(mod => (
          <ModuleItem
            key={mod.serial}
            module={mod}
            controlDisabledReason={controlDisabledReason}
          />
        ))
      )}
    </Card>
  )
}
