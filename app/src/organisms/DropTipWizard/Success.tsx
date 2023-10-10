import { useSelector } from 'react-redux'
import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  PrimaryButton,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  Flex,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { SmallButton } from '../../atoms/buttons'

interface SuccessProps {
  message: string
  proceedText: string
  handleProceed: () => void
}
export const Success = (props: SuccessProps): JSX.Element => {
  const { message, proceedText, handleProceed } = props
  const { i18n } = useTranslation()
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <SimpleWizardBody
      iconColor={COLORS.successEnabled}
      header={i18n.format(message, 'capitalize')}
      isSuccess
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
