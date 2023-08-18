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
import { AboutGripperSlideout } from './AboutGripperSlideout'
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
  const [
    showAboutGripperSlideout,
    setShowAboutGripperSlideout,
  ] = React.useState<boolean>(false)

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
            label: t('attach_gripper'),
            disabled: attachedGripper != null,
            onClick: handleAttach,
          },
        ]
      : [
          {
            label:
              attachedGripper.data.calibratedOffset?.last_modified != null
                ? t('recalibrate_gripper')
                : t('calibrate_gripper'),
            disabled: attachedGripper == null,
            onClick: handleCalibrate,
          },
          {
            label: t('detach_gripper'),
            disabled: attachedGripper == null,
            onClick: handleDetach,
          },
          {
            label: t('about_gripper'),
            disabled: attachedGripper == null,
            onClick: () => setShowAboutGripperSlideout(true),
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
      {attachedGripper != null && showAboutGripperSlideout && (
        <AboutGripperSlideout
          serialNumber={attachedGripper.serialNumber}
          firmwareVersion={attachedGripper.firmwareVersion}
          isExpanded={showAboutGripperSlideout}
          onCloseClick={() => setShowAboutGripperSlideout(false)}
        />
      )}
    </>
  )
}
