import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  Flex,
} from '@opentrons/components'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { SmallButton } from '../../atoms/buttons'

interface SuccessProps {
  handleProceed: () => void
}
export const Success = (props: SuccessProps): JSX.Element => {
  const { handleProceed } = props
  const { i18n, t } = useTranslation('shared')

  return (
    <SimpleWizardBody
      iconColor={COLORS.successEnabled}
      header={i18n.format(t('shared:success'), 'capitalize')}
      isSuccess
    >
      <Flex justifyContent={JUSTIFY_FLEX_END} width="100%">
        <SmallButton
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          buttonText={i18n.format(t('shared:close'), 'capitalize')}
          onClick={handleProceed}
        />
      </Flex>
    </SimpleWizardBody>
  )
}
