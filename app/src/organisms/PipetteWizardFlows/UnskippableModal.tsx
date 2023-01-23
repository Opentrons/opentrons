import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, TEXT_TRANSFORM_CAPITALIZE } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

interface UnskippableModalProps {
  goBack: () => void
}

export function UnskippableModal(props: UnskippableModalProps): JSX.Element {
  const { goBack } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('critical_unskippable_step')}
      subHeader={t('must_detach_mounting_plate')}
      isSuccess={false}
    >
      <PrimaryButton onClick={goBack} textTransform={TEXT_TRANSFORM_CAPITALIZE}>
        {t('shared:return')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
}
