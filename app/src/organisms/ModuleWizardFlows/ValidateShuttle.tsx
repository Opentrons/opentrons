import { useTranslation } from 'react-i18next'

import { COLORS, PrimaryButton } from '@opentrons/components'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardStepProps } from './types'

interface ValidateShuttleProps extends ModuleSetupWizardStepProps {
  deckConfig: DeckConfiguration
}

export const ValidateShuttle = (
  props: ValidateShuttleProps
): JSX.Element | null => {
  const { proceed, goBack } = props
  const { t, i18n } = useTranslation(['module_wizard_flows'])

  if (
    props.attachedModule.moduleType === FLEX_STACKER_MODULE_TYPE &&
    props.attachedModule.data.platformState == 'extended'
  ) {
    proceed()
    return null
  } else {
    return (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('shuttle_install_fail')}
        subHeader={t('shuttle_install_fail_description')}
      >
        <PrimaryButton
          onClick={() => {
            goBack()
          }}
        >
          {i18n.format(t('try_again'), 'capitalize')}
        </PrimaryButton>
      </SimpleWizardBody>
    )
  }
}
