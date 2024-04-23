import React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PromptGuide } from '../../molecules/PromptGuide'
import { InputPrompt } from '../../molecules/InputPrompt'

export function ChatContainer(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const isDummyInitial = true
  return (
    <Flex
      padding={`${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing24}`}
      backgroundColor={COLORS.grey10}
      width="100%"
    >
      {/* This will be updated when input textbox and function are implemented */}
      {isDummyInitial ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          position={POSITION_RELATIVE}
          width="100%"
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            width="100%"
          >
            <StyledText>{t('opentronsai')}</StyledText>
            <PromptGuide />
          </Flex>
          <Flex
            position={POSITION_ABSOLUTE}
            bottom="0"
            width="100%"
            gridGap={SPACING.spacing24}
            flexDirection={DIRECTION_COLUMN}
          >
            <InputPrompt />
            <StyledText css={DISCLAIMER_TEXT_STYLE}>
              {t('disclaimer')}
            </StyledText>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

const DISCLAIMER_TEXT_STYLE = css`
  color: ${COLORS.grey55};
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  text-align: ${TYPOGRAPHY.textAlignCenter};
`
