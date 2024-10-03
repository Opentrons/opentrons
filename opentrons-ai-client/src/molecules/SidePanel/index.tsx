import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Link,
  OVERFLOW_AUTO,
  POSITION_FIXED,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { PromptButton } from '../../organisms/PromptButton'
import LOGO_PATH from '../../assets/images/opentrons_logo.svg'

const IMAGE_ALT = 'Opentrons logo'
const FEEDBACK_FORM_LINK = 'https://opentrons-ai-beta.paperform.co/'
export function SidePanel(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  return (
    <Flex
      position={POSITION_FIXED}
      padding={SPACING.spacing40}
      gridGap={SPACING.spacing80}
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={COLORS.black90}
      width="24.375rem"
      overflowY={OVERFLOW_AUTO}
      height="100vh"
    >
      {/* logo */}
      <Flex>
        <img src={LOGO_PATH} width="194.192" height="48.133" alt={IMAGE_ALT} />
      </Flex>

      {/* body text */}
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText css={HEADER_TEXT_STYLE}>
          {t('side_panel_header')}
        </LegacyStyledText>
        <LegacyStyledText css={BODY_TEXT_STYLE}>
          {t('side_panel_body')}
        </LegacyStyledText>
      </Flex>

      {/* buttons */}
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText css={BUTTON_GUIDE_TEXT_STYLE}>
          {t('try_example_prompts')}
        </LegacyStyledText>

        <Flex gridGap={SPACING.spacing16} flexWrap={WRAP}>
          <PromptButton buttonText={t('reagent_transfer')} />
          <PromptButton buttonText={t('reagent_transfer_flex')} />
          <PromptButton buttonText={t('pcr')} />
          <PromptButton buttonText={t('pcr_flex')} />
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize20}
          lineHeight={TYPOGRAPHY.lineHeight24}
          color={COLORS.white}
        >
          {t('got_feedback')}
        </LegacyStyledText>
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

const FeedbackLink = styled(Link)`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  color: ${COLORS.white};
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
`
