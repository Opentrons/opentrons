import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_ROW,
  SPACING,
  JUSTIFY_FLEX_END,
  WRAP,
} from '@opentrons/components'
import { getGripperDisplayName } from '@opentrons/shared-data'
import { TertiaryButton } from '/app/atoms/buttons'
import { SetupCalibrationItem } from './SetupCalibrationItem'
import { GripperWizardFlows } from '/app/organisms/GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '/app/organisms/GripperWizardFlows/constants'

import type { GripperData } from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { GripperWizardFlowType } from '/app/organisms/GripperWizardFlows/types'

interface SetupGripperCalibrationItemProps {
  gripperData: GripperData | null
  runId: string
}

export function SetupGripperCalibrationItem({
  gripperData,
  runId,
}: SetupGripperCalibrationItemProps): JSX.Element | null {
  const { t, i18n } = useTranslation('protocol_setup')
  const [
    openWizardFlowType,
    setOpenWizardFlowType,
  ] = useState<GripperWizardFlowType | null>(null)

  const gripperCalLastModified =
    gripperData != null
      ? gripperData.data.calibratedOffset?.last_modified ?? null
      : null

  let button: JSX.Element | undefined

  if (gripperData == null) {
    button = (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <TertiaryButton
          onClick={() => {
            setOpenWizardFlowType(GRIPPER_FLOW_TYPES.ATTACH)
          }}
        >
          {i18n.format(t('attach_gripper'), 'capitalize')}
        </TertiaryButton>
      </Flex>
    )
  } else if (gripperCalLastModified == null) {
    button = (
      <Flex
        alignItems={ALIGN_CENTER}
        marginLeft={SPACING.spacing16}
        flexWrap={WRAP}
        justifyContent={JUSTIFY_FLEX_END}
        gridGap={SPACING.spacing8}
      >
        <TertiaryButton
          onClick={() => {
            setOpenWizardFlowType(GRIPPER_FLOW_TYPES.RECALIBRATE)
          }}
        >
          {t('calibrate_now')}
        </TertiaryButton>
      </Flex>
    )
  }

  return (
    <>
      <SetupCalibrationItem
        button={button}
        calibratedDate={
          gripperData != null
            ? gripperData.data.calibratedOffset?.last_modified ?? null
            : null
        }
        label={t('extension_mount')}
        title={
          gripperData != null
            ? getGripperDisplayName(gripperData.instrumentModel as GripperModel)
            : ''
        }
        runId={runId}
      />
      {openWizardFlowType != null ? (
        <GripperWizardFlows
          flowType={openWizardFlowType}
          attachedGripper={gripperData}
          closeFlow={() => {
            setOpenWizardFlowType(null)
          }}
        />
      ) : null}
    </>
  )
}
