import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { InstrumentCard } from '../../molecules/InstrumentCard'
import { GripperWizardFlows } from '../GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import { GripperWizardFlowType } from '../GripperWizardFlows/types'

const TEMP_STUB_ATTACHED_GRIPPER = {
  model: 'temp_fake_gripper_model',
  serialNumber: 'temp_fake_gripper_serial_number',
}

interface AttachedGripper {
  model: string
  serialNumber: string
}
interface GripperCardProps {
  attachedGripper: AttachedGripper | null
  robotName: string
  /**
   * TODO: remove this local gripper state setter once attached gripper is wired to robot server
   */
  tempSetAttachedGripper: (attachedGripper: AttachedGripper | null) => void
}

export function GripperCard({
  attachedGripper,
  robotName,
  tempSetAttachedGripper,
}: GripperCardProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const [
    openWizardFlowType,
    setOpenWizardFlowType,
  ] = React.useState<GripperWizardFlowType | null>(null)

  const handleAttach: React.MouseEventHandler<HTMLButtonElement> = () => {
    tempSetAttachedGripper(TEMP_STUB_ATTACHED_GRIPPER)
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.ATTACH)
    console.log('TODO: handle attach gripper', robotName)
  }

  const handleDetach: React.MouseEventHandler<HTMLButtonElement> = () => {
    tempSetAttachedGripper(null)
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.DETACH)
    console.log('TODO: handle detach gripper', robotName)
  }

  const handleCalibrate: React.MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.RECALIBRATE)
    console.log('TODO: handle calibrate gripper', robotName)
  }

  const menuOverlayItems =
    attachedGripper == null
      ? [
          {
            label: 'Attach gripper',
            disabled: attachedGripper != null,
            onClick: handleAttach,
          },
        ]
      : [
          {
            label: 'Recalibrate gripper',
            disabled: attachedGripper == null,
            onClick: handleCalibrate,
          },
          {
            label: 'Detach gripper',
            disabled: attachedGripper == null,
            onClick: handleDetach,
          },
        ]
  return (
    <>
      <InstrumentCard
        description={
          attachedGripper != null ? attachedGripper.model : t('shared:empty')
        }
        isGripperAttached={attachedGripper != null}
        label={t('shared:extension_mount')}
        menuOverlayItems={menuOverlayItems}
      />
      {openWizardFlowType != null ? (
        <GripperWizardFlows
          flowType={openWizardFlowType}
          closeFlow={() => setOpenWizardFlowType(null)}
        />
      ) : null}
    </>
  )
}
