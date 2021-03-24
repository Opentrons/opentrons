// @flow
// attached modules container card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import isEmpty from 'lodash/isEmpty'
import { css } from 'styled-components'

import {
  Box,
  Card,
  BORDER_SOLID_LIGHT,
  SPACING_3,
  useInterval,
} from '@opentrons/components'
import {
  fetchModules,
  getAttachedModules,
  getModuleControlsDisabled,
} from '../../../redux/modules'
import { getConnectedRobotName } from '../../../redux/robot/selectors'
import { ModuleItem, NoModulesMessage } from './ModuleItem'

import type { AttachedModule } from '../../../redux/modules/types'
import type { State, Dispatch } from '../../../redux/types'
import { UsbHubItem } from './UsbHubItem'

// TODO(bc, 2021-02-16): i18n

const TITLE = 'Connected Modules'
const POLL_MODULE_INTERVAL_MS = 5000

type ContentsByPortProps = {|
  modulesByPort: {| [slot: number]: Array<AttachedModule> |},
  controlDisabledReason: string | null,
|}

type Props = {| robotName: string |}

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
  const modulesByPort = modules.reduce((portMap, module) => {
    const port = module.usbPort.hub || module.usbPort.port
    if (port !== null) {
      const portContents = portMap[port] ?? []
      portMap[port] = [...portContents, module]
    }
    return portMap
  }, {})

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
      ) : !isEmpty(modulesByPort) ? (
        Object.keys(modulesByPort).map(port => (
          <Box
            key={port}
            paddingX={SPACING_3}
            paddingY="1.5rem"
            borderBottom={BORDER_SOLID_LIGHT}
            css={css`
              &:last-child: {
                border-bottom: 1px solid transparent;
              }
            `}
          >
            {modulesByPort[port].length > 1 ? (
              <UsbHubItem
                hub={port}
                modules={modulesByPort[port]}
                controlDisabledReason={controlDisabledReason}
              />
            ) : (
              <ModuleItem
                usbPort={port}
                key={modulesByPort[port][0].serial}
                module={modulesByPort[port][0]}
                controlDisabledReason={controlDisabledReason}
              />
            )}
          </Box>
        ))
      ) : (
        modules.map(mod => (
          <Box
            key={mod.serial}
            paddingX={SPACING_3}
            paddingY="1.5rem"
            borderBottom={BORDER_SOLID_LIGHT}
            css={css`
              &:last-child: {
                border-bottom: 1px solid transparent;
              }
            `}
          >
            <ModuleItem
              key={mod.serial}
              module={mod}
              controlDisabledReason={controlDisabledReason}
            />
          </Box>
        ))
      )}
    </Card>
  )
}
