import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { useTranslation } from 'react-i18next'
import { COLORS, TYPOGRAPHY, AlertPrimaryButton } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

interface UnskippableModalProps {
  goBack: () => void
  isOnDevice: boolean | null
}

export function UnskippableModal(props: UnskippableModalProps): JSX.Element {
  const { goBack, isOnDevice } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('critical_unskippable_step')}
      subHeader={t('must_detach_mounting_plate')}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          onClick={goBack}
          buttonText={capitalize(t('shared:return'))}
          buttonType="alert"
        />
      ) : (
        <AlertPrimaryButton
          onClick={goBack}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('shared:return')}
        </AlertPrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
