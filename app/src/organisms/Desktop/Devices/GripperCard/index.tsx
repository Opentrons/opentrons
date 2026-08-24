import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { InlineNotification } from '@opentrons/components'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'
import { getGripperDisplayName } from '@opentrons/shared-data'

import { InstrumentCard } from '/app/molecules/InstrumentCard'
import { GripperWizardFlows } from '/app/organisms/GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '/app/organisms/GripperWizardFlows/constants'

import { AboutGripperSlideout } from './AboutGripperSlideout'

import type { MouseEventHandler, ReactNode } from 'react'
import type { BadGripper, GripperData } from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { MenuOverlayItemProps } from '/app/molecules/InstrumentCard/MenuOverlay'
import type { GripperWizardFlowType } from '/app/organisms/GripperWizardFlows/types'

interface GripperCardProps {
  attachedGripper: GripperData | BadGripper | null
  isCalibrated: boolean
  isRunActive: boolean
  isEstopNotDisengaged: boolean
}

const INSTRUMENT_CARD_STYLE = css`
  p {
    text-transform: lowercase;
  }

  p::first-letter {
    text-transform: uppercase;
  }
`

const POLL_DURATION_MS = 5000

export function GripperCard({
  attachedGripper,
  isCalibrated,
  isRunActive,
  isEstopNotDisengaged,
}: GripperCardProps): ReactNode {
  const { t, i18n } = useTranslation(['device_details', 'shared'])
  const [openWizardFlowType, setOpenWizardFlowType] =
    useState<GripperWizardFlowType | null>(null)
  const [showAboutGripperSlideout, setShowAboutGripperSlideout] =
    useState<boolean>(false)

  const handleAttach: MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.ATTACH)
  }

  const handleDetach: MouseEventHandler<HTMLButtonElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.DETACH)
  }

  const handleCalibrate: MouseEventHandler<HTMLAnchorElement> = () => {
    setOpenWizardFlowType(GRIPPER_FLOW_TYPES.RECALIBRATE)
  }
  const [pollForSubsystemUpdate, setPollForSubsystemUpdate] = useState(false)
  const { data: subsystemUpdateData } = useCurrentSubsystemUpdateQuery(
    'gripper',
    {
      enabled: pollForSubsystemUpdate,
      refetchInterval: POLL_DURATION_MS,
    }
  )
  // we should poll for a subsystem update from the time a bad instrument is
  // detected until the update has been done for 5 seconds
  // this gives the instruments endpoint time to start reporting
  // a good instrument
  useEffect(() => {
    if (attachedGripper?.ok === false) {
      setPollForSubsystemUpdate(true)
    } else if (
      subsystemUpdateData != null &&
      subsystemUpdateData.data.updateStatus === 'done'
    ) {
      setTimeout(() => {
        setPollForSubsystemUpdate(false)
      }, POLL_DURATION_MS)
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
            onClick: () => {
              setShowAboutGripperSlideout(true)
            },
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
              : i18n.format(t('shared:empty'), 'capitalize')
          }
          banner={
            attachedGripper?.ok && !isCalibrated ? (
              <InlineNotification
                type="error"
                message={t('calibration_needed_without_link')}
                linkText={isEstopNotDisengaged ? undefined : t('calibrate_now')}
                onLinkClick={isEstopNotDisengaged ? undefined : handleCalibrate}
                minWidth="12.625rem"
              />
            ) : null
          }
          isGripperAttached={attachedGripper != null}
          label={t('extension_mount')}
          menuOverlayItems={menuOverlayItems as MenuOverlayItemProps[]}
          isEstopNotDisengaged={isEstopNotDisengaged}
        />
      ) : null}
      {attachedGripper?.ok === false ||
      (subsystemUpdateData != null && pollForSubsystemUpdate) ? (
        <InstrumentCard
          label={i18n.format(t('mount', { side: 'extension' }), 'capitalize')}
          css={INSTRUMENT_CARD_STYLE}
          description={t('instrument_attached')}
          banner={
            <InlineNotification
              type={subsystemUpdateData != null ? 'alert' : 'error'}
              message={
                subsystemUpdateData != null
                  ? t('firmware_update_occurring')
                  : t('firmware_update_needed')
              }
              minWidth="12.625rem"
            />
          }
          isEstopNotDisengaged={isEstopNotDisengaged}
        />
      ) : null}
      {openWizardFlowType != null ? (
        <GripperWizardFlows
          flowType={openWizardFlowType}
          attachedGripper={attachedGripper}
          closeFlow={() => {
            setOpenWizardFlowType(null)
          }}
        />
      ) : null}
      {attachedGripper?.ok && showAboutGripperSlideout && (
        <AboutGripperSlideout
          serialNumber={attachedGripper.serialNumber}
          firmwareVersion={attachedGripper.firmwareVersion}
          isExpanded={showAboutGripperSlideout}
          onCloseClick={() => {
            setShowAboutGripperSlideout(false)
          }}
        />
      )}
    </>
  )
}
