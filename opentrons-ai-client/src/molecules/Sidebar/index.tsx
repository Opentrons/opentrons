import React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import LOGO_PATH from '../../assets/images/opentrons_logo.svg'

const IMAGE_ALT = 'Opentrons logo'

export function SideBar(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  return (
    <Flex
      padding={SPACING.spacing40}
      gridGap={SPACING.spacing80}
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={COLORS.black90}
      width="24.375rem"
      height="64rem"
    >
      {/* logo */}
      <Flex>
        <img src={LOGO_PATH} width="194.192" height="48.133" alt={IMAGE_ALT} />
      </Flex>

      {/* body text */}
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <StyledText css={HEADER_TEXT_STYLE}>{t('sidebar_header')}</StyledText>
        <StyledText css={BODY_TEXT_STYLE}>{t('sidebar_body')}</StyledText>
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
  border-radius: 2rem;
  white-space: nowrap;
`
