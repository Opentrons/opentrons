import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { SPACING } from '@opentrons/components'
import { getGripperDisplayName, GripperModel } from '@opentrons/shared-data'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'
import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import { InstrumentCard } from '../../molecules/InstrumentCard'
import { GripperWizardFlows } from '../GripperWizardFlows'
import { AboutGripperSlideout } from './AboutGripperSlideout'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import type { BadGripper, GripperData, Subsystem } from '@opentrons/api-client'
import type { GripperWizardFlowType } from '../GripperWizardFlows/types'

interface GripperCardProps {
  attachedGripper: GripperData | BadGripper | null
  isCalibrated: boolean
  setSubsystemToUpdate: (subsystem: Subsystem | null) => void
  isRunActive: boolean
}
const BANNER_LINK_CSS = css`
  text-decoration: underline;
  cursor: pointer;
  margin-left: ${SPACING.spacing8};
`

const INSTRUMENT_CARD_STYLE = css`
  p {
    text-transform: lowercase;
  }

  p::first-letter {
    text-transform: uppercase;
  }
`

const SUBSYSTEM_UPDATE_POLL_MS = 5000

export function GripperCard({
  attachedGripper,
  isCalibrated,
  setSubsystemToUpdate,
  isRunActive,
}: GripperCardProps): JSX.Element {
  const { t, i18n } = useTranslation(['device_details', 'shared'])
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
  const [pollForSubsystemUpdate, setPollForSubsystemUpdate] = React.useState(
    false
  )
  const { data: subsystemUpdateData } = useCurrentSubsystemUpdateQuery(
    'gripper',
    {
      enabled: pollForSubsystemUpdate,
      refetchInterval: SUBSYSTEM_UPDATE_POLL_MS,
    }
  )
  // we should poll for a subsystem update from the time a bad instrument is
  // detected until the update has been done for 5 seconds
  // this gives the instruments endpoint time to start reporting
  // a good instrument
  React.useEffect(() => {
    if (attachedGripper?.ok === false) {
      setPollForSubsystemUpdate(true)
    } else if (
      subsystemUpdateData != null &&
      subsystemUpdateData.status === 'done'
    ) {
      setTimeout(() => {
        setPollForSubsystemUpdate(false)
      }, 5000)
    }
  }, [attachedGripper?.ok, subsystemUpdateData])

  const menuOverlayItems =
    attachedGripper == null || !attachedGripper.ok
      ? [
          {
            label: t('attach_gripper'),
            disabled: attachedGripper != null || isRunActive,
            onClick: handleAttach,
          },
        ]
      : [
          {
            label:
              attachedGripper.data.calibratedOffset?.last_modified != null
                ? t('recalibrate_gripper')
                : t('calibrate_gripper'),
            disabled: attachedGripper == null || isRunActive,
            onClick: handleCalibrate,
          },
          {
            label: t('detach_gripper'),
            disabled: attachedGripper == null || isRunActive,
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
      {(attachedGripper == null || attachedGripper.ok) &&
      subsystemUpdateData == null ? (
        <InstrumentCard
          description={
            attachedGripper != null
              ? getGripperDisplayName(
                  attachedGripper.instrumentModel as GripperModel
                )
              : t('shared:empty')
          }
          banner={
            attachedGripper?.ok && !isCalibrated ? (
              <Banner type="error" marginBottom={SPACING.spacing4}>
                <Trans
                  t={t}
                  i18nKey="calibration_needed"
                  components={{
                    calLink: (
                      <StyledText
                        as="p"
                        css={BANNER_LINK_CSS}
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
      ) : null}
      {attachedGripper?.ok === false ||
      (subsystemUpdateData != null && pollForSubsystemUpdate) ? (
        <InstrumentCard
          label={i18n.format(t('mount', { side: 'extension' }), 'capitalize')}
          css={INSTRUMENT_CARD_STYLE}
          description={t('instrument_attached')}
          banner={
            <Banner
              type={subsystemUpdateData != null ? 'warning' : 'error'}
              marginBottom={SPACING.spacing4}
            >
              <Trans
                t={t}
                i18nKey={
                  subsystemUpdateData != null
                    ? 'firmware_update_occurring'
                    : 'firmware_update_available_now'
                }
                components={{
                  updateLink: (
                    <StyledText
                      as="p"
                      css={BANNER_LINK_CSS}
                      onClick={() => setSubsystemToUpdate('gripper')}
                    />
                  ),
                }}
              />
            </Banner>
          }
        />
      ) : null}
      {openWizardFlowType != null ? (
        <GripperWizardFlows
          flowType={openWizardFlowType}
          attachedGripper={attachedGripper}
          closeFlow={() => setOpenWizardFlowType(null)}
        />
      ) : null}
      {attachedGripper?.ok && showAboutGripperSlideout && (
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
