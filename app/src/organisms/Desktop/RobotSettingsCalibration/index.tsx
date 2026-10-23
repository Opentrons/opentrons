import { useState } from 'react'

import { Divider, SPACING } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'

import { HowCalibrationWorksModal } from '../HowCalibrationWorksModal'
import { CalibrationDataDownload } from './CalibrationDataDownload'
import { RobotSettingsGripperCalibration } from './RobotSettingsGripperCalibration'
import { RobotSettingsModuleCalibration } from './RobotSettingsModuleCalibration'
import { RobotSettingsPipetteOffsetCalibration } from './RobotSettingsPipetteOffsetCalibration'

import type { ReactNode } from 'react'
import type { GripperData } from '@opentrons/api-client'
import type { Mount } from '@opentrons/components'

const CALS_FETCH_MS = 5000

interface CalibrationProps {
  robotName: string
  isRobotBusy: boolean
}

export interface FormattedPipetteOffsetCalibration {
  modelName?: string
  serialNumber?: string
  mount: Mount
  tiprack?: string
  lastCalibrated?: string
  markedBad?: boolean
}

export function RobotSettingsCalibration({
  robotName,
  isRobotBusy,
}: CalibrationProps): ReactNode {
  const [showHowCalibrationWorksModal, setShowHowCalibrationWorksModal] =
    useState(false)

  // Modules Calibration
  const attachedModules =
    useModulesQuery({
      refetchInterval: CALS_FETCH_MS,
    })?.data?.data ?? []

  // Note: following fetch need to reflect the latest state of calibrations
  // when a user does calibration or rename a robot.

  const attachedInstruments =
    useInstrumentsQuery({ refetchInterval: CALS_FETCH_MS }).data?.data ?? []
  const attachedGripper =
    (attachedInstruments ?? []).find(
      (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
    ) ?? null
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()

  const formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] =
    []

  formattedPipetteOffsetCalibrations.push({
    modelName: attachedPipettes.left?.displayName,
    serialNumber: attachedPipettes.left?.serialNumber,
    mount: 'left' as Mount,
    lastCalibrated: attachedPipettes.left?.data.calibratedOffset?.last_modified,
  })
  formattedPipetteOffsetCalibrations.push({
    modelName: attachedPipettes.right?.displayName,
    serialNumber: attachedPipettes.right?.serialNumber,
    mount: 'right' as Mount,
    lastCalibrated:
      attachedPipettes.right?.data.calibratedOffset?.last_modified,
  })

  return (
    <>
      {showHowCalibrationWorksModal ? (
        <HowCalibrationWorksModal
          onCloseClick={() => {
            setShowHowCalibrationWorksModal(false)
          }}
        />
      ) : null}
      <CalibrationDataDownload
        {...{ robotName, setShowHowCalibrationWorksModal }}
      />
      <Divider marginTop={SPACING.spacing24} marginBottom={0} />
      <RobotSettingsPipetteOffsetCalibration
        formattedPipetteOffsetCalibrations={formattedPipetteOffsetCalibrations}
        robotName={robotName}
        isRobotBusy={isRobotBusy}
      />
      <Divider marginY={0} />
      <RobotSettingsGripperCalibration
        gripper={attachedGripper}
        robotName={robotName}
      />
      <Divider marginY={0} />
      <RobotSettingsModuleCalibration
        attachedModules={attachedModules}
        formattedPipetteOffsetCalibrations={formattedPipetteOffsetCalibrations}
        robotName={robotName}
        isRobotBusy={isRobotBusy}
      />
    </>
  )
}
