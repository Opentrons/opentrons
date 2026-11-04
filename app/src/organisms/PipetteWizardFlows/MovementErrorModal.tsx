import { COLORS } from '@opentrons/components'

import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'

export function MovementErrorModal({ t }: { t: TFunction }): ReactNode {
  return (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.red50}
      header={t('pipette_attachment_error')}
      subHeader={t('pipette_attachment_error_message')}
    />
  )
}
