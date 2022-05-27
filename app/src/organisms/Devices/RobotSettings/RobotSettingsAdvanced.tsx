import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Box, SPACING, IconProps } from '@opentrons/components'
import { Divider } from '../../../atoms/structure'
import { Toast } from '../../../atoms/Toast'
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
import { useRobot } from '../hooks'
import { UpdateBuildroot } from '../../../pages/Robots/RobotSettings/UpdateBuildroot'
import { getRobotSettings } from '../../../redux/robot-settings'
import { RenameRobotSlideout } from './AdvancedTab/AdvancedTabSlideouts/RenameRobotSlideout'
import { FactoryResetSlideout } from './AdvancedTab/AdvancedTabSlideouts/FactoryResetSlideout'
import { FactoryResetModal } from './AdvancedTab/AdvancedTabSlideouts/FactoryResetModal'

import type { State } from '../../../redux/types'
import type {
  RobotSettings,
  RobotSettingsField,
} from '../../../redux/robot-settings/types'
import type { ResetConfigRequest } from '../../../redux/robot-admin/types'
import { UNREACHABLE } from '../../../redux/discovery'

interface RobotSettingsAdvancedProps {
  robotName: string
}

export function RobotSettingsAdvanced({
  robotName,
}: RobotSettingsAdvancedProps): JSX.Element {
  const { t } = useTranslation('device_settings')
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
  ] = React.useState<boolean>(false)
  const [showDownloadToast, setShowDownloadToast] = React.useState<boolean>(
    false
  )

  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const robot = useRobot(robotName)
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
    settings?.find(s => s.id === id)

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
    if (options != null) setResetOptions(options)
    setShowFactoryResetModal(true)
    setIsRobotConnected(isConnected ?? false)
  }

  const updateDownloadLogsStatus = (isDownloading: boolean): void =>
    setShowDownloadToast(isDownloading)

  return (
    <>
      {showSoftwareUpdateModal &&
      robot != null &&
      robot.status !== UNREACHABLE ? (
        <UpdateBuildroot
          robot={robot}
          close={() => setShowSoftwareUpdateModal(false)}
        />
      ) : null}
      {showDownloadToast && (
        <Toast
          message={t('update_robot_software_download_logs_toast_message')}
          type="info"
          icon={toastIcon}
          closeButton={false}
          onClose={() => setShowDownloadToast(false)}
          requiredTimeout={false}
        />
      )}
      <Box>
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
        <Divider marginY="2.5rem" />
        <RobotServerVersion robotName={robotName} />
        <Divider marginY="2.5rem" />
        <RobotInformation robotName={robotName} />
        <Divider marginY="2.5rem" />
        <UsageSettings
          settings={findSettings('enableDoorSafetySwitch')}
          robotName={robotName}
        />
        <Divider marginY="2.5rem" />
        <DisableHoming
          settings={findSettings('disableHomeOnBoot')}
          robotName={robotName}
        />
        <Divider marginY="2.5rem" />
        <OpenJupyterControl robotIp={ipAddress} />
        <Divider marginY={SPACING.spacing5} />
        <UpdateRobotSoftware
          robotName={robotName}
          onUpdateStart={() => setShowSoftwareUpdateModal(true)}
        />
        <Troubleshooting
          robotName={robotName}
          updateDownloadLogsStatus={updateDownloadLogsStatus}
        />
        <Divider marginY="2.5rem" />
        <FactoryReset updateIsExpanded={updateIsExpanded} />
        <Divider marginY="2.5rem" />
        <UseOlderProtocol
          settings={findSettings('disableFastProtocolUpload')}
          robotName={robotName}
        />
        <LegacySettings
          settings={findSettings('deckCalibrationDots')}
          robotName={robotName}
        />
        <Divider marginY="2.5rem" />
        <ShortTrashBin
          settings={findSettings('shortFixedTrash')}
          robotName={robotName}
        />
        <Divider marginY="2.5rem" />
        <UseOlderAspirateBehavior
          settings={findSettings('useOldAspirationFunctions')}
          robotName={robotName}
        />
      </Box>
    </>
  )
}
