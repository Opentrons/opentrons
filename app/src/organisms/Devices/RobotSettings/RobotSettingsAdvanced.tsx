import * as React from 'react'
import { useSelector } from 'react-redux'
import { Box, SPACING } from '@opentrons/components'
import { Divider } from '../../../atoms/structure'
import { AboutRobotName } from './AdvancedTab/AboutRobotName'
import { RobotInformation } from './AdvancedTab/RobotInformation'
import { RobotServerVersion } from './AdvancedTab/RobotServerVersion'
import { UsageSettings } from './AdvancedTab/UsageSettings'
import { DisableHoming } from './AdvancedTab/DisableHoming'
import { OpenJupyterControl } from './AdvancedTab/OpenJupyterControl'
import { UpdateRobotSoftware } from './AdvancedTab/UpdateRobotSoftware'
import { Troubleshooting } from './AdvancedTab/Troubleshooting'
import { FactoryReset } from './AdvancedTab/FactoryReset'
import { UseOlderProtocol } from './AdvancedTab/UseOlderProtocol'
import { LegacySettings } from './AdvancedTab/LegacySettings'
import { ShortTrashBin } from './AdvancedTab/ShortTrashBin'
import { UseOlderAspirateBehavior } from './AdvancedTab/UseOlderAspirateBehavior'
import { getRobotByName } from '../../../redux/discovery'

import type { State } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

interface RobotSettingsAdvancedProps {
  robotName: string
}

export function RobotSettingsAdvanced({
  robotName,
}: RobotSettingsAdvancedProps): JSX.Element {
  const robot = useSelector((state: State) => getRobotByName(state, robotName))
  //   const controlDisabled = robot?.status !== CONNECTABLE
  //   const logsAvailable = robot?.health && robot?.health.logs
  //   const robotLogsDownloading = useSelector(getRobotLogsDownloading)

  //   const pauseProtocol // ask Brian

  return (
    <>
      <Box paddingX={SPACING.spacing4}>
        <AboutRobotName robotName={robotName} />
        <Divider marginY={SPACING.spacing5} />
        <RobotServerVersion robot={robot as ViewableRobot} />
        <Divider marginY={SPACING.spacing5} />
        <RobotInformation robot={robot as ViewableRobot} />
        <Divider marginY={SPACING.spacing5} />
        <UsageSettings />
        <Divider marginY={SPACING.spacing5} />
        <DisableHoming />
        <Divider marginY={SPACING.spacing5} />
        <OpenJupyterControl robotIp={''} />
        <Divider marginY={SPACING.spacing5} />
        <UpdateRobotSoftware />
        <Troubleshooting robot={robot as ViewableRobot} />
        <Divider marginY={SPACING.spacing5} />
        <FactoryReset />
        <Divider marginY={SPACING.spacing5} />
        <UseOlderProtocol />
        <LegacySettings />
        <Divider marginY={SPACING.spacing5} />
        <ShortTrashBin />
        <Divider marginY={SPACING.spacing5} />
        <UseOlderAspirateBehavior />
      </Box>
    </>
  )
}
