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
}

export function GripperCard({
  attachedGripper,
  robotName,
}: GripperCardProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const [
    openWizardFlowType,
    setOpenWizardFlowType,
  ] = React.useState<GripperWizardFlowType | null>(null)

  const handleAttach: React.MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.ATTACH)
  }

  const handleDetach: React.MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.DETACH)
  }

  const handleCalibrate: React.MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.RECALIBRATE)
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
