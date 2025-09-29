import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

interface AutoAddPauseUntilTempStepModalProps {
  displayTemperature: string
  handleSkipPauseClick: () => void
  handleAddPauseClick: () => void
  displayModule: string
}

export const AutoAddPauseUntilTempStepModal = (
  props: AutoAddPauseUntilTempStepModalProps
): JSX.Element => {
  const {
    displayTemperature,
    handleSkipPauseClick,
    handleAddPauseClick,
    displayModule,
  } = props
  const { t } = useTranslation('modal')

  return (
    <Modal
      marginLeft="0"
      title={t('auto_add_pause_until_temp_step.legacy.title', {
        module: displayModule,
        temp: displayTemperature,
      })}
      titleElement1={
        <Icon name="alert-circle" size="1.25rem" color={COLORS.yellow50} />
      }
      childrenPadding={SPACING.spacing24}
      footer={
        <Flex
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap={SPACING.spacing8}
          justifyContent={ALIGN_FLEX_END}
        >
          <SecondaryButton onClick={handleSkipPauseClick}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('auto_add_pause_until_temp_step.legacy.skip_pause_step')}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton onClick={handleAddPauseClick}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('auto_add_pause_until_temp_step.legacy.add_pause_step')}
            </StyledText>
          </PrimaryButton>
        </Flex>
      }
    >
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('auto_add_pause_until_temp_step.legacy.body', {
            module: displayModule,
            temp: displayTemperature,
          })}
        </StyledText>
      </Flex>
    </Modal>
  )
}
