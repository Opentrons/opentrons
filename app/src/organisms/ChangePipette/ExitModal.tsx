import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { AlertPrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { SimpleWizardModal } from '../../molecules/SimpleWizardModal'

import type { Mount } from '@opentrons/components'
import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { Direction } from './types'

interface Props {
  back: () => void
  exit: () => void
  direction: Direction
  currentStep: number
  totalSteps: number
  mount: Mount
  displayName?: PipetteModelSpecs['displayName']
}

export function ExitModal(props: Props): JSX.Element {
  const {
    back,
    exit,
    direction,
    currentStep,
    totalSteps,
    mount,
    displayName,
  } = props
  const { t } = useTranslation(['change_pipette', 'shared'])
  const flow = direction === 'attach' ? t('attaching') : t('detaching')

  let title: string = t('attach_pipette')
  if (direction === 'attach' && displayName != null) {
    title = t('attach_name_pipette', { pipette: displayName })
  } else if (direction === 'detach' && displayName == null) {
    title = t('detach')
  } else if (direction === 'detach' && displayName != null) {
    title = t('detach_pipette', {
      pipette: displayName,
      mount: mount[0].toUpperCase() + mount.slice(1),
    })
  }

  return (
    <Portal level="top">
      <SimpleWizardModal
        iconColor={COLORS.warningEnabled}
        header={t('progress_will_be_lost')}
        subHeader={t('are_you_sure_exit', { direction: flow })}
        onExit={exit}
        isSuccess={false}
        title={title}
        currentStep={currentStep}
        totalSteps={totalSteps}
      >
        <SecondaryButton onClick={back} marginRight={SPACING.spacing2}>
          {t('go_back')}
        </SecondaryButton>
        <AlertPrimaryButton
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          onClick={exit}
        >
          {t('shared:exit')}
        </AlertPrimaryButton>
      </SimpleWizardModal>
    </Portal>
  )
}
