import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { InlineNotification } from '@opentrons/components'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'

import { InstrumentCard } from '/app/molecules/InstrumentCard'
import {
  DropTipWizardFlows,
  useDropTipWizardFlows,
} from '/app/organisms/DropTipWizardFlows'
import { handlePipetteWizardFlows } from '/app/organisms/PipetteWizardFlows'
import { ChoosePipette } from '/app/organisms/PipetteWizardFlows/ChoosePipette'
import { FLOWS } from '/app/organisms/PipetteWizardFlows/constants'

import { AboutPipetteSlideout } from './AboutPipetteSlideout'

import type { MouseEventHandler } from 'react'
import type { BadPipette, Mount, PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { MenuOverlayItemProps } from '/app/molecules/InstrumentCard/MenuOverlay'
import type {
  PipetteWizardFlow,
  SelectablePipettes,
} from '/app/organisms/PipetteWizardFlows/types'

interface FlexPipetteCardProps {
  attachedPipette: PipetteData | BadPipette | null
  pipetteModelSpecs: PipetteModelSpecs | null
  mount: Mount
  robotName: string
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

export function FlexPipetteCard({
  pipetteModelSpecs,
  attachedPipette,
  mount,
  robotName,
  isRunActive,
  isEstopNotDisengaged,
}: FlexPipetteCardProps): JSX.Element {
  const { t, i18n } = useTranslation(['device_details', 'shared'])

  const [showAboutPipetteSlideout, setShowAboutPipetteSlideout] =
    useState<boolean>(false)
  const [showChoosePipette, setShowChoosePipette] = useState(false)
  const [selectedPipette, setSelectedPipette] = useState<SelectablePipettes>(
    SINGLE_MOUNT_PIPETTES
  )
  const attachedPipetteIs96Channel =
    attachedPipette?.ok && attachedPipette.instrumentName === 'p1000_96'
  const selectedPipetteForWizard = attachedPipetteIs96Channel
    ? NINETY_SIX_CHANNEL
    : selectedPipette
  const setCloseFlow = (): void => {
    setSelectedPipette(SINGLE_MOUNT_PIPETTES)
  }

  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { showDTWiz, enableDTWiz, disableDTWiz } = useDropTipWizardFlows()

  const handleLaunchPipetteWizardFlows = (
    flowType: PipetteWizardFlow
  ): void => {
    handlePipetteWizardFlows({
      flowType,
      mount,
      closeFlow: setCloseFlow,
      selectedPipette: selectedPipetteForWizard,
      robotName,
    })
  }
  const handleChoosePipette: MouseEventHandler<HTMLButtonElement> = () => {
    setShowChoosePipette(true)
  }
  const handleAttach = (): void => {
    setShowChoosePipette(false)
    handleLaunchPipetteWizardFlows(FLOWS.ATTACH)
  }

  const handleDetach: MouseEventHandler<HTMLButtonElement> = () => {
    handleLaunchPipetteWizardFlows(FLOWS.DETACH)
  }

  const handleCalibrate: MouseEventHandler<HTMLAnchorElement> = () => {
    handleLaunchPipetteWizardFlows(FLOWS.CALIBRATE)
  }

  const [pollForSubsystemUpdate, setPollForSubsystemUpdate] = useState(false)
  const subsystem = attachedPipette?.subsystem ?? null
  const { data: subsystemUpdateData } = useCurrentSubsystemUpdateQuery(
    subsystem,
    {
      enabled: pollForSubsystemUpdate,
      refetchInterval: POLL_DURATION_MS,
    }
  )
  const pipetteDisplayName = pipetteModelSpecs?.displayName
  // we should poll for a subsystem update from the time a bad instrument is
  // detected until the update has been done for 5 seconds
  // this gives the instruments endpoint time to start reporting
  // a good instrument
  useEffect(() => {
    if (attachedPipette?.ok === false) {
      setPollForSubsystemUpdate(true)
    } else if (
      subsystemUpdateData != null &&
      subsystemUpdateData.data.updateStatus === 'done'
    ) {
      setTimeout(() => {
        setPollForSubsystemUpdate(false)
      }, POLL_DURATION_MS)
    }
  }, [attachedPipette?.ok, subsystemUpdateData])

  const menuOverlayItems =
    attachedPipette == null || !attachedPipette.ok
      ? [
          {
            label: t('attach_pipette'),
            disabled: attachedPipette != null || isRunActive,
            onClick: handleChoosePipette,
          },
        ]
      : [
          {
            label:
              attachedPipette.data.calibratedOffset?.last_modified != null
                ? t('recalibrate_pipette')
                : t('calibrate_pipette'),
            disabled: attachedPipette == null || isRunActive,
            onClick: handleCalibrate,
          },
          {
            label: t('detach_pipette'),
            disabled: attachedPipette == null || isRunActive,
            onClick: handleDetach,
          },
          {
            label: t('about_pipette'),
            disabled: attachedPipette == null,
            onClick: () => {
              setShowAboutPipetteSlideout(true)
            },
          },
          {
            label: i18n.format(t('drop_tips'), 'capitalize'),
            disabled: attachedPipette == null || isRunActive,
            onClick: () => {
              enableDTWiz()
            },
          },
        ]

  return (
    <>
      {(attachedPipette == null || attachedPipette.ok) &&
      subsystemUpdateData == null ? (
        <InstrumentCard
          description={
            attachedPipette != null && pipetteDisplayName != null
              ? pipetteDisplayName
              : i18n.format(t('shared:empty'), 'capitalize')
          }
          instrumentDiagramProps={{
            pipetteSpecs: pipetteModelSpecs,
            mount,
          }}
          banner={
            attachedPipette?.ok &&
            attachedPipette.data.calibratedOffset?.last_modified == null ? (
              <InlineNotification
                type="error"
                message={t('calibration_needed_without_link')}
                linkText={isEstopNotDisengaged ? undefined : t('calibrate_now')}
                onLinkClick={isEstopNotDisengaged ? undefined : handleCalibrate}
                minWidth="12.625rem"
              />
            ) : null
          }
          label={
            attachedPipetteIs96Channel
              ? t('both_mounts')
              : mount === LEFT
                ? t('left_mount')
                : t('right_mount')
          }
          menuOverlayItems={menuOverlayItems as MenuOverlayItemProps[]}
          isEstopNotDisengaged={isEstopNotDisengaged}
        />
      ) : null}
      {attachedPipette?.ok === false ||
      (subsystemUpdateData != null && pollForSubsystemUpdate) ? (
        <InstrumentCard
          label={i18n.format(t('mount', { side: mount }), 'capitalize')}
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
      {showDTWiz && pipetteModelSpecs != null ? (
        <DropTipWizardFlows
          robotType={FLEX_ROBOT_TYPE}
          mount={mount}
          instrumentModelSpecs={pipetteModelSpecs}
          closeFlow={disableDTWiz}
          modalStyle="simple"
        />
      ) : null}
      {attachedPipette?.ok && showAboutPipetteSlideout ? (
        <AboutPipetteSlideout
          pipetteId={attachedPipette.serialNumber}
          pipetteName={pipetteDisplayName ?? attachedPipette.instrumentName}
          firmwareVersion={attachedPipette.firmwareVersion}
          isExpanded={showAboutPipetteSlideout}
          onCloseClick={() => {
            setShowAboutPipetteSlideout(false)
          }}
        />
      ) : null}
      {showChoosePipette ? (
        <ChoosePipette
          proceed={handleAttach}
          setSelectedPipette={setSelectedPipette}
          selectedPipette={selectedPipette}
          exit={() => {
            setShowChoosePipette(false)
          }}
          mount={mount}
        />
      ) : null}
    </>
  )
}
