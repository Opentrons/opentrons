import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  PrimaryButton,
} from '@opentrons/components'

import { GoBack } from './GoBack'

import type { WizardTileProps } from './types'

export function SelectModules(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed } = props
  const { t } = useTranslation('shared')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        modules
      <GoBack
        onClick={() => {
          goBack()
        }}
      />
      <PrimaryButton
        onClick={() => {
          proceed()
        }}
      >
        {t('confirm')}
      </PrimaryButton>
    </Flex>
  )
}
