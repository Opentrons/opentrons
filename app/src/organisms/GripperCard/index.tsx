import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { GripperData } from '@opentrons/api-client'
import { SPACING } from '@opentrons/components'
import { getGripperDisplayName, GripperModel } from '@opentrons/shared-data'
import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import { InstrumentCard } from '../../molecules/InstrumentCard'
import { GripperWizardFlows } from '../GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import type { GripperWizardFlowType } from '../GripperWizardFlows/types'

interface GripperCardProps {
  attachedGripper: GripperData | null
  isCalibrated: boolean
}

export function GripperCard({
  attachedGripper,
  isCalibrated,
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
          attachedGripper != null
            ? getGripperDisplayName(
                attachedGripper.instrumentModel as GripperModel
              )
            : t('shared:empty')
        }
        banner={
          attachedGripper != null && !isCalibrated ? (
            <Banner type="error" marginBottom={SPACING.spacing4}>
              <Trans
                t={t}
                i18nKey="calibration_needed"
                components={{
                  calLink: (
                    <StyledText
                      as="p"
                      css={css`
                        text-decoration: underline;
                        cursor: pointer;
                        margin-left: 0.5rem;
                      `}
                      onClick={handleCalibrate}
                    />
                  ),
                }}
              />
            </Banner>
          ) : null
        }
        isGripperAttached={attachedGripper != null}
        label={t('shared:extension_mount')}
        menuOverlayItems={menuOverlayItems}
      />
      {openWizardFlowType != null ? (
        <GripperWizardFlows
          flowType={openWizardFlowType}
          attachedGripper={attachedGripper}
          closeFlow={() => setOpenWizardFlowType(null)}
        />
      ) : null}
    </>
  )
}
