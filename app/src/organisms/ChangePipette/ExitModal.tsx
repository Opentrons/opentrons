import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { AlertPrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { SimpleWizardModal } from '../../molecules/SimpleWizardModal'

import type { Direction } from './types'

interface Props {
  back: () => void
  exit: () => void
  direction: Direction
}

export function ExitModal(props: Props): JSX.Element {
  const { back, exit, direction } = props
  const { t } = useTranslation(['change_pipette', 'shared'])
  const flow = direction === 'attach' ? t('attaching') : t('detaching')

  return (
    <SimpleWizardModal
      iconColor={COLORS.warningEnabled}
      header={t('progress_will_be_lost')}
      subHeader={t('are_you_sure_exit', { direction: flow })}
      isSuccess={false}
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
  )
}
