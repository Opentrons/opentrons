import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_FLEX_END,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  NINETY_SIX_CHANNEL,
} from '@opentrons/shared-data'
import { LEFT, RIGHT } from '../../redux/pipettes'
import { getLocalRobot } from '../../redux/discovery'
import { FLOWS } from '../../organisms/PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { PrimaryButton, TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '../../organisms/GripperWizardFlows/constants'
import { GripperWizardFlowType } from '../../organisms/GripperWizardFlows/types'

import type { Mount } from '../../redux/pipettes/types'
import type {
  PipetteWizardFlow,
  SelectablePipettes,
} from '../../organisms/PipetteWizardFlows/types'
import type { PipetteMount } from '@opentrons/shared-data'


export function AttachedInstruments(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing3}
    >
      <PipetteMountItem mount={LEFT} />
      <PipetteMountItem mount={RIGHT} />
      <ExtensionMountItem />

      {/* temp button to robot dashboard */}
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
      >
        <Link to="dashboard">
          <TertiaryButton>To Robot Dashboard</TertiaryButton>
        </Link>
      </Flex>
    </Flex>
  )
}

interface PipetteMountItemProps {
  mount: Mount
}
function PipetteMountItem(props: PipetteMountItemProps): JSX.Element {
  const { mount } = props
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name
  const [
    pipetteWizardFlow,
    setPipetteWizardFlow,
  ] = React.useState<PipetteWizardFlow | null>(null)
  const handleAttachPipette = () => {
    setPipetteWizardFlow(FLOWS.ATTACH)
  }
  const handleDetachPipette = () => {
    setPipetteWizardFlow(FLOWS.DETACH)
  }
  const handleCalibratePipette = () => {
    setPipetteWizardFlow(FLOWS.CALIBRATE)
  }
  return (
    <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
      <StyledText as="h3">{mount} PIPETTE MOUNT ACTIONS:</StyledText>
      <PrimaryButton onClick={handleAttachPipette}>ATTACH PIPETTE</PrimaryButton>
      <PrimaryButton onClick={handleDetachPipette}>DETACH PIPETTE</PrimaryButton>
      <PrimaryButton onClick={handleCalibratePipette}>CALIBRATE PIPETTE</PrimaryButton>
      {pipetteWizardFlow != null ? (
        <PipetteWizardFlows
          flowType={pipetteWizardFlow}
          mount={(mount as PipetteMount)}
          closeFlow={() => setPipetteWizardFlow(null)}
          robotName={robotName}
          selectedPipette="96-Channel"
        />
      ) : null}

    </Flex>
  )
}

const TEMP_STUB_ATTACHED_GRIPPER = {
  model: 'temp_fake_gripper_model',
  serialNumber: 'temp_fake_gripper_serial_number',
}

function ExtensionMountItem(): JSX.Element {
  // TODO(BC, 2022-12-13): replace with attachedGripper after RLAB-88 is done
  const [tempAttachedGripper, tempSetAttachedGripper] = React.useState<{
    model: string
    serialNumber: string
  } | null>(null)

  const [
    openWizardFlowType,
    setOpenWizardFlowType,
  ] = React.useState<GripperWizardFlowType | null>(null)
  const handleAttach: React.MouseEventHandler<HTMLButtonElement> = () => {
    tempSetAttachedGripper(TEMP_STUB_ATTACHED_GRIPPER)
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.ATTACH)
  }

  const handleDetach: React.MouseEventHandler<HTMLButtonElement> = () => {
    tempSetAttachedGripper(null)
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.DETACH)
  }

  const handleCalibrate: React.MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.RECALIBRATE)
  }


  return (
    <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
      <StyledText as="h3">GRIPPER MOUNT ACTIONS:</StyledText>
      {tempAttachedGripper == null ?
        (
          <PrimaryButton onClick={handleAttach}>ATTACH</PrimaryButton>
        ) : (
          <>
            <PrimaryButton onClick={handleDetach}>DETACH</PrimaryButton>
            <PrimaryButton onClick={handleCalibrate}>CALIBRATE</PrimaryButton>
          </>
        )
      }
      {openWizardFlowType != null ? (
        <GripperWizardFlows
          flowType={openWizardFlowType}
          closeFlow={() => setOpenWizardFlowType(null)}
        />
      ) : null}
    </Flex>
  )
}