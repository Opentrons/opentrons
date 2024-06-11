import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  PrimaryButton,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  Flex,
  SPACING,
} from '@opentrons/components'

import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { SmallButton } from '../../atoms/buttons'

import type { DropTipWizardContainerProps } from './types'

type SuccessProps = DropTipWizardContainerProps & {
  message: string
  proceedText: string
  handleProceed: () => void
}
export const Success = (props: SuccessProps): JSX.Element => {
  const { message, proceedText, handleProceed, isOnDevice } = props

  const { i18n } = useTranslation(['drop_tip_wizard', 'shared'])

  return (
    <SimpleWizardBody
      iconColor={COLORS.green50}
      header={i18n.format(message, 'capitalize')}
      isSuccess
      paddingX={SPACING.spacing32}
    >
      {isOnDevice ? (
        <Flex justifyContent={JUSTIFY_FLEX_END} width="100%">
          <SmallButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            buttonText={proceedText}
            onClick={handleProceed}
          />
        </Flex>
      ) : (
        <PrimaryButton onClick={handleProceed}>{proceedText}</PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
