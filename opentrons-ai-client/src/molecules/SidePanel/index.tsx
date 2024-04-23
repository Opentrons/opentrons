import React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Link,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import LOGO_PATH from '../../assets/images/opentrons_logo.svg'

const IMAGE_ALT = 'Opentrons logo'
const FEEDBACK_FORM_LINK = 'https://opentrons-ai-beta.paperform.co/'
export function SidePanel(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  return (
    <Flex
      padding={SPACING.spacing40}
      gridGap={SPACING.spacing80}
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={COLORS.black90}
      width="24.375rem"
    >
      {/* logo */}
      <Flex>
        <img src={LOGO_PATH} width="194.192" height="48.133" alt={IMAGE_ALT} />
      </Flex>

      {/* body text */}
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <StyledText css={HEADER_TEXT_STYLE}>
          {t('side_panel_header')}
        </StyledText>
        <StyledText css={BODY_TEXT_STYLE}>{t('side_panel_body')}</StyledText>
      </Flex>

      {/* buttons */}
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <StyledText css={BUTTON_GUIDE_TEXT_STYLE}>
          {t('try_example_prompts')}
        </StyledText>

        <Flex gridGap={SPACING.spacing16} flexWrap={WRAP}>
          {/* ToDo(kk:04/11/2024) add a button component */}
          <PromptButton>{t('reagent_transfer')}</PromptButton>
          <PromptButton>{t('reagent_transfer_flex')}</PromptButton>
          <PromptButton>{t('prc')}</PromptButton>
          <PromptButton>{t('prc_flex')}</PromptButton>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize20}
          lineHeight={TYPOGRAPHY.lineHeight24}
          color={COLORS.white}
        >
          {t('got_feedback')}
        </StyledText>
        <FeedbackLink external href={FEEDBACK_FORM_LINK}>
          {t('share_your_thoughts')}
        </FeedbackLink>
      </Flex>
    </Flex>
  )
}

const HEADER_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  color: ${COLORS.white};
`
const BODY_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  color: ${COLORS.white};
`
const BUTTON_GUIDE_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  color: ${COLORS.white};
`

const PromptButton = styled(PrimaryButton)`
  border-radius: ${BORDERS.borderRadiusFull};
  white-space: nowrap;
`

const FeedbackLink = styled(Link)`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  color: ${COLORS.white};
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
`
