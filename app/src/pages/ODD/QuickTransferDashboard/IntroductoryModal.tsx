import { useTranslation } from 'react-i18next'
import {
  SPACING,
  StyledText,
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { OddModal } from '/app/molecules/OddModal'
import { SmallButton } from '/app/atoms/buttons'

import imgSrc from '/app/assets/images/on-device-display/odd-abstract-6.png'

interface IntroductoryModalProps {
  onClose: () => void
}

export const IntroductoryModal = (
  props: IntroductoryModalProps
): JSX.Element => {
  const { t } = useTranslation(['quick_transfer', 'shared'])

  return (
    <OddModal modalSize="small">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        textAlign={TEXT_ALIGN_CENTER}
        gridGap={SPACING.spacing20}
        width="100%"
      >
        <img
          alt={t('welcome_to_quick_transfer')}
          src={imgSrc}
          width="454px"
          height="128px"
        />
        <StyledText oddStyle="level4HeaderBold">
          {t('welcome_to_quick_transfer')}
        </StyledText>
        <StyledText oddStyle="bodyTextRegular">
          {t('a_way_to_move_liquid')}
        </StyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            width="454px"
            buttonText={t('got_it')}
            onClick={props.onClose}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
