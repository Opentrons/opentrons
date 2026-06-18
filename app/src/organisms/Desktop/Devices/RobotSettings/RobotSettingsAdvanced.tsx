import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { ToggleButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import { getFeatureFlags } from '/app/redux/config'
import { getRobotSerialNumber, UNREACHABLE } from '/app/redux/discovery'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useCurrentRun } from '/app/resources/runs'

import {
  DeviceReset,
  DisableStackerSensors,
  DisplayRobotName,
  EnableErrorRecoveryMode,
  EnableStatusLight,
  EnterRobotEncryptionKey,
  FactoryMode,
  GantryHoming,
  LegacySettings,
  OpenJupyterControl,
  RobotInformation,
  RobotServerVersion,
  ShortTrashBin,
  Troubleshooting,
  UpdateRobotSoftware,
  UsageSettings,
  UseOlderAspirateBehavior,
} from './AdvancedTab'
import { DeviceResetModal } from './AdvancedTab/AdvancedTabSlideouts/DeviceResetModal'
import { DeviceResetSlideout } from './AdvancedTab/AdvancedTabSlideouts/DeviceResetSlideout'
import { FactoryModeSlideout } from './AdvancedTab/AdvancedTabSlideouts/FactoryModeSlideout'
import { RenameRobotSlideout } from './AdvancedTab/AdvancedTabSlideouts/RenameRobotSlideout'
import { handleUpdateBuildroot } from './UpdateBuildroot'

import type { MouseEventHandler } from 'react'
import type { RobotSettingsField } from '@opentrons/api-client'
import type { ResetConfigRequest } from '/app/redux/robot-admin/types'

interface RobotSettingsAdvancedProps {
  robotName: string
  isRobotBusy: boolean
}

export function RobotSettingsAdvanced({
  robotName,
  isRobotBusy,
}: RobotSettingsAdvancedProps): JSX.Element {
  const [showRenameRobotSlideout, setShowRenameRobotSlideout] =
    useState<boolean>(false)
  const [showDeviceResetSlideout, setShowDeviceResetSlideout] =
    useState<boolean>(false)
  const [showDeviceResetModal, setShowDeviceResetModal] =
    useState<boolean>(false)
  const [showFactoryModeSlideout, setShowFactoryModeSlideout] =
    useState<boolean>(false)

  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const currentRun = useCurrentRun()
  const featureFlags = useSelector(getFeatureFlags)

  const robot = useRobot(robotName)
  const isFlex = useIsFlex(robotName)
  const ipAddress = robot?.ip != null ? robot.ip : ''
  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const reachable = robot?.status !== UNREACHABLE
  const sn = robot?.status != null ? getRobotSerialNumber(robot) : null

  const [isRobotReachable, setIsRobotReachable] = useState<boolean>(reachable)
  // todo(mm, 2025-03-27): This duplicates the default resetOptions inside DeviceResetSlideout.
  const [resetOptions, setResetOptions] = useState<ResetConfigRequest>({
    resetLabwareOffsets: false,
    settingsResets: {},
  })
  const findSettings = (id: string): RobotSettingsField | undefined =>
    settings?.find(s => s.id === id)

  const updateIsExpanded = (
    isExpanded: boolean,
    type: 'deviceReset' | 'renameRobot'
  ): void => {
    if (type === 'deviceReset') {
      setShowDeviceResetSlideout(isExpanded)
    } else {
      setShowRenameRobotSlideout(isExpanded)
    }
  }

  const updateResetStatus = (
    isReachable: boolean,
    options?: ResetConfigRequest
  ): void => {
    if (options != null) setResetOptions(options)
    setShowDeviceResetModal(true)
    setIsRobotReachable(isReachable ?? false)
  }

  return (
    <>
      <Box>
        {showRenameRobotSlideout && (
          <RenameRobotSlideout
            isExpanded={showRenameRobotSlideout}
            onCloseClick={() => {
              setShowRenameRobotSlideout(false)
            }}
            robotName={robotName}
          />
        )}
        {showFactoryModeSlideout && (
          <FactoryModeSlideout
            isExpanded={showFactoryModeSlideout}
            isRobotBusy={isRobotBusy || isEstopNotDisengaged}
            onCloseClick={() => {
              setShowFactoryModeSlideout(false)
            }}
            robotName={robotName}
            sn={sn}
          />
        )}
        {showDeviceResetSlideout && (
          <DeviceResetSlideout
            isExpanded={showDeviceResetSlideout}
            onCloseClick={() => {
              setShowDeviceResetSlideout(false)
            }}
            robotName={robotName}
            updateResetStatus={updateResetStatus}
          />
        )}
        {showDeviceResetModal &&
          createPortal(
            <DeviceResetModal
              closeModal={() => {
                setShowDeviceResetModal(false)
              }}
              isRobotReachable={isRobotReachable}
              robotName={robotName}
              resetOptions={resetOptions}
            />,
            getTopPortalEl()
          )}
        <DisplayRobotName
          robotName={robotName}
          updateIsExpanded={updateIsExpanded}
          isRobotBusy={isRobotBusy || isEstopNotDisengaged}
        />
        <Divider marginY={SPACING.spacing16} />
        <RobotServerVersion robotName={robotName} />
        <Divider marginY={SPACING.spacing16} />
        <RobotInformation robotName={robotName} />
        {featureFlags.accessControlMode ? (
          <>
            <Divider marginY={SPACING.spacing16} />
            <EnterRobotEncryptionKey
            // Note: Unlike other buttons on this page,
            // this should be available even if the robot is busy.
            />
          </>
        ) : null}
        {isFlex ? null : (
          <>
            <Divider marginY={SPACING.spacing16} />
            <UsageSettings
              settings={findSettings('enableDoorSafetySwitch')}
              robotName={robotName}
              isRobotBusy={isRobotBusy || isEstopNotDisengaged}
            />
          </>
        )}
        <Divider marginY={SPACING.spacing16} />
        <GantryHoming
          settings={findSettings('disableHomeOnBoot')}
          robotName={robotName}
          isRobotBusy={isRobotBusy || isEstopNotDisengaged}
        />

        {isFlex ? (
          <>
            <Divider marginY={SPACING.spacing16} />
            <EnableStatusLight
              robotName={robotName}
              isEstopNotDisengaged={isEstopNotDisengaged}
            />
          </>
        ) : null}
        {isFlex ? (
          <>
            <Divider marginY={SPACING.spacing16} />
            <EnableErrorRecoveryMode isRobotBusy={isRobotBusy} />
          </>
        ) : null}
        {isFlex ? (
          <>
            <Divider marginY={SPACING.spacing16} />
            <DisableStackerSensors
              robotName={robotName}
              isRobotBusy={isRobotBusy || isEstopNotDisengaged}
            />
          </>
        ) : null}
        <Divider marginY={SPACING.spacing16} />
        <OpenJupyterControl
          robotIp={ipAddress}
          isEstopNotDisengaged={isEstopNotDisengaged}
        />
        <Divider marginY={SPACING.spacing16} />
        <UpdateRobotSoftware
          robotName={robotName}
          currentRun={currentRun}
          onUpdateStart={() => {
            handleUpdateBuildroot(robot)
          }}
        />
        <Divider marginY={SPACING.spacing16} />
        {isFlex ? (
          <>
            <FactoryMode
              isRobotBusy={isRobotBusy || isEstopNotDisengaged}
              setShowFactoryModeSlideout={setShowFactoryModeSlideout}
              sn={sn}
            />
            <Divider marginY={SPACING.spacing16} />
          </>
        ) : null}
        <Troubleshooting robotName={robotName} />
        <Divider marginY={SPACING.spacing16} />
        <DeviceReset
          updateIsExpanded={updateIsExpanded}
          isRobotBusy={isRobotBusy || isEstopNotDisengaged}
        />
        {isFlex ? null : (
          <>
            <Divider marginY={SPACING.spacing16} />
            <LegacySettings
              settings={findSettings('deckCalibrationDots')}
              robotName={robotName}
              isRobotBusy={isRobotBusy || isEstopNotDisengaged}
            />
            <Divider marginY={SPACING.spacing16} />
            <ShortTrashBin
              settings={findSettings('shortFixedTrash')}
              robotName={robotName}
              isRobotBusy={isRobotBusy || isEstopNotDisengaged}
            />
            <Divider marginY={SPACING.spacing16} />
            <UseOlderAspirateBehavior
              settings={findSettings('useOldAspirationFunctions')}
              robotName={robotName}
              isRobotBusy={isRobotBusy || isEstopNotDisengaged}
            />
          </>
        )}
      </Box>
    </>
  )
}

interface FeatureFlagToggleProps {
  settingField: RobotSettingsField
  robotName: string
  isRobotBusy: boolean
}

export function FeatureFlagToggle({
  settingField,
  robotName,
  isRobotBusy,
}: FeatureFlagToggleProps): JSX.Element | null {
  const { updateRobotSetting } = useUpdateRobotSettingMutation()
  const { value, id, title, description } = settingField

  if (id == null) return null

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      updateRobotSetting({ id, value: !value })
    }
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing16}
    >
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
        >
          {title}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">{description}</LegacyStyledText>
      </Box>
      <ToggleButton
        label={title}
        toggledOn={value === true}
        onClick={handleClick}
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
