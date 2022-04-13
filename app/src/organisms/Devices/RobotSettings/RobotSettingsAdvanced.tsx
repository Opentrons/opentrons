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
import { getRobotSettings } from '../../../redux/robot-settings'

import type { State } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'
import type { RobotSettings } from '../../../redux/robot-settings/types'
interface RobotSettingsAdvancedProps {
  robotName: string
}

export function RobotSettingsAdvanced({
  robotName,
}: RobotSettingsAdvancedProps): JSX.Element {
  const robot = useSelector((state: State) => getRobotByName(state, robotName))

  //   const pauseProtocol // ask Brian
  const ipAddress = robot?.ip != null ? robot.ip : ''
  const settings = useSelector<State, RobotSettings>((state: State) =>
    getRobotSettings(state, robotName)
  )

  const findSettings = (id: string) => settings.find(s => s.id === id)

  return (
    <>
      <Box paddingX={SPACING.spacing4}>
        <AboutRobotName robotName={robotName} />
        <Divider marginY={SPACING.spacing5} />
        <RobotServerVersion robot={robot as ViewableRobot} />
        <Divider marginY={SPACING.spacing5} />
        <RobotInformation robot={robot as ViewableRobot} />
        <Divider marginY={SPACING.spacing5} />
        <UsageSettings
          settings={findSettings('enableDoorSafetySwitch')}
          robotName={robotName}
        />
        <Divider marginY={SPACING.spacing5} />
        <DisableHoming
          settings={findSettings('disableHomeOnBoot')}
          robotName={robotName}
        />
        <Divider marginY={SPACING.spacing5} />
        <OpenJupyterControl robotIp={ipAddress} />
        <Divider marginY={SPACING.spacing5} />
        <UpdateRobotSoftware robotName={robotName} />
        <Troubleshooting robot={robot as ViewableRobot} />
        <Divider marginY={SPACING.spacing5} />
        <FactoryReset />
        <Divider marginY={SPACING.spacing5} />
        <UseOlderProtocol
          settings={findSettings('disableFastProtocolUpload')}
          robotName={robotName}
        />
        <LegacySettings
          settings={findSettings('deckCalibrationDots')}
          robotName={robotName}
        />
        <Divider marginY={SPACING.spacing5} />
        <ShortTrashBin
          settings={findSettings('shortFixedTrash')}
          robotName={robotName}
        />
        <Divider marginY={SPACING.spacing5} />
        <UseOlderAspirateBehavior
          settings={findSettings('useOldAspirationFunctions')}
          robotName={robotName}
        />
      </Box>
    </>
  )
}
