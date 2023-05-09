import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, AlertPrimaryButton } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

interface UnskippableModalProps {
  goBack: () => void
  isOnDevice: boolean | null
}

export function UnskippableModal(props: UnskippableModalProps): JSX.Element {
  const { goBack, isOnDevice } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={i18n.format(t('critical_unskippable_step'), 'capitalize')}
      subHeader={t('must_detach_mounting_plate')}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          onClick={goBack}
          buttonText={i18n.format(t('shared:return'), 'capitalize')}
          buttonType="alert"
        />
      ) : (
        <AlertPrimaryButton onClick={goBack}>
          {i18n.format(t('shared:return'), 'capitalize')}
        </AlertPrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
