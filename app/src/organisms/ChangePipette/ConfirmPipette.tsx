import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { CheckPipettesButton } from './CheckPipettesButton'
import { SimpleWizardModal } from '../../molecules/SimpleWizardModal'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'
import type { PipetteOffsetCalibration } from '../../redux/calibration/types'

export interface ConfirmPipetteProps {
  robotName: string
  mount: Mount
  success: boolean
  attachedWrong: boolean
  wantedPipette: PipetteNameSpecs | null
  actualPipette: PipetteModelSpecs | null
  actualPipetteOffset: PipetteOffsetCalibration | null
  displayName: string
  displayCategory: PipetteDisplayCategory | null
  tryAgain: () => void
  exit: () => void
  startPipetteOffsetCalibration: () => void
  currentStep: number
  totalSteps: number
}

export function ConfirmPipette(props: ConfirmPipetteProps): JSX.Element {
  const {
    wantedPipette,
    actualPipette,
    success,
    exit,
    currentStep,
    totalSteps,
    mount,
  } = props
  const { t } = useTranslation('change_pipette')

  const getPipetteStatusDetails = (
    props: ConfirmPipetteProps
  ): { header: string; subHeader: string } => {
    const { displayName, wantedPipette, attachedWrong, success } = props
    let header
    let subHeader

    if (wantedPipette && success) {
      header = t('pipette_attached')
      subHeader = t('pipette_is_ready_to_use', {
        pipette: wantedPipette.displayName,
      })
    } else if (wantedPipette) {
      header = attachedWrong
        ? t('incorrect_pipette_attached')
        : t('unable_to_detect_pipette', {
            pipette: wantedPipette.displayName ?? 'pipette',
          })

      subHeader = attachedWrong
        ? t('attached_pipette_does_not_match', {
            name: displayName,
            pipette: wantedPipette.displayName,
          })
        : t('press_white_connector')
    } else {
      header = success
        ? t('successfully_detached_pipette')
        : t('pipette_still_detected')
      subHeader = success ? '' : t('check_pipette_is_unplugged')
    }

    return { header, subHeader }
  }

  const { header, subHeader } = getPipetteStatusDetails({ ...props })

  let title

  if ((!wantedPipette && !actualPipette) || (!wantedPipette && actualPipette)) {
    title = t('detatch_pipette_from_mount', {
      mount: mount[0].toUpperCase() + mount.slice(1),
    })
  } else {
    title = t('attach_name_pipette', { pipette: wantedPipette?.displayName })
  }

  return (
    <SimpleWizardModal
      iconColor={success ? COLORS.successEnabled : COLORS.errorEnabled}
      header={header}
      subHeader={subHeader}
      isSuccess={success}
      onExit={exit}
      title={title}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <>
        {!success && <TryAgainButton {...props} />}
        {success && <SuccessAndExitButtons {...props} />}
      </>
    </SimpleWizardModal>
  )
}

function TryAgainButton(props: ConfirmPipetteProps): JSX.Element {
  const {
    actualPipette,
    attachedWrong,
    wantedPipette,
    robotName,
    tryAgain,
    exit,
  } = props
  const { t } = useTranslation('change_pipette')
  if (wantedPipette && attachedWrong) {
    return (
      <>
        <SecondaryButton marginRight={SPACING.spacing3} onClick={exit}>
          {t('use_attached_pipette')}
        </SecondaryButton>
        <PrimaryButton onClick={tryAgain}>
          {t('detatch_try_again')}
        </PrimaryButton>
      </>
    )
  } else if (!actualPipette) {
    return (
      <>
        <SecondaryButton marginRight={SPACING.spacing3} onClick={exit}>
          {t('cancel_attachment')}
        </SecondaryButton>
        <CheckPipettesButton robotName={robotName}>
          {t('recheck_connection')}
        </CheckPipettesButton>
      </>
    )
  }
  return (
    <>
      <SecondaryButton marginRight={SPACING.spacing3} onClick={exit}>
        {t('leave_attached')}
      </SecondaryButton>
      <PrimaryButton onClick={tryAgain}>{t('try_again')}</PrimaryButton>
    </>
  )
}

function SuccessAndExitButtons(props: ConfirmPipetteProps): JSX.Element {
  const {
    actualPipette,
    actualPipetteOffset,
    exit,
    startPipetteOffsetCalibration,
    success,
  } = props
  const { t } = useTranslation('change_pipette')
  return (
    <>
      {success && actualPipette && !actualPipetteOffset && (
        <SecondaryButton
          marginRight={SPACING.spacing3}
          onClick={startPipetteOffsetCalibration}
        >
          {t('calibrate_pipette_offset')}
        </SecondaryButton>
      )}
      <PrimaryButton textTransform={TEXT_TRANSFORM_CAPITALIZE} onClick={exit}>
        {t('shared:exit')}
      </PrimaryButton>
    </>
  )
}
