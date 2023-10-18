import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  PrimaryButton,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  Flex,
} from '@opentrons/components'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SmallButton } from '../../atoms/buttons'

interface SuccessProps {
  message: string
  proceedText: string
  handleProceed: () => void
  isRobotMoving: boolean
  isExiting: boolean
  isOnDevice: boolean
}
export const Success = (props: SuccessProps): JSX.Element => {
  const {
    message,
    proceedText,
    handleProceed,
    isRobotMoving,
    isExiting,
    isOnDevice,
  } = props

  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])

  return isRobotMoving && !isExiting ? (
    <InProgressModal
      alternativeSpinner={null}
      description={t('stand_back_exiting')}
    />
  ) : (
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
