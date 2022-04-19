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
import { RenameRobotSlideout } from './AdvancedTab/AdvancedTabSlideouts/RenameRobotSlideout'
import { FactoryResetSlideout } from './AdvancedTab/AdvancedTabSlideouts/FactoryResetSlideout'
import { FactoryResetModal } from './AdvancedTab/AdvancedTabSlideouts/FactoryResetModal'
import { SoftwareUpdateModal } from './AdvancedTab/SoftwareUpdateModal'

import type { State } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'
import type {
  RobotSettings,
  RobotSettingsField,
} from '../../../redux/robot-settings/types'
import type { ResetConfigRequest } from '../../../redux/robot-admin/types'

interface RobotSettingsAdvancedProps {
  robotName: string
}

export function RobotSettingsAdvanced({
  robotName,
}: RobotSettingsAdvancedProps): JSX.Element {
  const [
    showRenameRobotSlideout,
    setShowRenameRobotSlideout,
  ] = React.useState<boolean>(false)
  const [
    showFactoryResetSlideout,
    setShowFactoryResetSlideout,
  ] = React.useState<boolean>(false)
  const [
    showFactoryResetModal,
    setShowFactoryResetModal,
  ] = React.useState<boolean>(false)
  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(true)

  const robot = useSelector((state: State) => getRobotByName(state, robotName))
  const ipAddress = robot?.ip != null ? robot.ip : ''
  const settings = useSelector<State, RobotSettings>((state: State) =>
    getRobotSettings(state, robotName)
  )
  const connected = robot?.connected != null && robot.connected

  const [isRobotConnected, setIsRobotConnected] = React.useState<boolean>(
    connected
  )
  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})
  const findSettings = (id: string): RobotSettingsField | undefined =>
    settings.find(s => s.id === id)

  const updateIsExpanded = (
    isExpanded: boolean,
    type: 'factoryReset' | 'renameRobot'
  ): void => {
    if (type === 'factoryReset') {
      setShowFactoryResetSlideout(isExpanded)
    } else {
      setShowRenameRobotSlideout(isExpanded)
    }
  }

  const updateResetStatus = (
    isConnected: boolean,
    options?: ResetConfigRequest
  ): void => {
    if (connected && options != null) setResetOptions(options)
    setShowFactoryResetModal(true)
    setIsRobotConnected(isConnected ?? false)
  }

  return (
    <>
      {showSoftwareUpdateModal && (
        <SoftwareUpdateModal
          closeModal={() => setShowSoftwareUpdateModal(false)}
        />
      )}
      <Box paddingX={SPACING.spacing4}>
        {showRenameRobotSlideout && (
          <RenameRobotSlideout
            isExpanded={showRenameRobotSlideout}
            onCloseClick={() => setShowRenameRobotSlideout(false)}
            robotName={robotName}
          />
        )}
        {showFactoryResetSlideout && (
          <FactoryResetSlideout
            isExpanded={showFactoryResetSlideout}
            onCloseClick={() => setShowFactoryResetSlideout(false)}
            robotName={robotName}
            updateResetStatus={updateResetStatus}
          />
        )}
        {showFactoryResetModal && (
          <FactoryResetModal
            closeModal={() => setShowFactoryResetModal(false)}
            isRobotConnected={isRobotConnected}
            robotName={robotName}
            resetOptions={resetOptions}
          />
        )}
        <AboutRobotName
          robotName={robotName}
          updateIsExpanded={updateIsExpanded}
        />
        <Divider marginY={SPACING.spacing5} />
        <RobotServerVersion
          robot={robot as ViewableRobot}
          robotName={robotName}
        />
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
        <FactoryReset updateIsExpanded={updateIsExpanded} />
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
