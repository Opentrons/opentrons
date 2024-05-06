import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Box,
  DIRECTION_ROW,
  BORDERS,
  ALIGN_CENTER,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  COLORS,
  SPACING,
  RESPONSIVENESS,
  StyledText,
  Icon,
} from '@opentrons/components'

import { useErrorName } from './utils'
import { NON_DESIGN_SANCTIONED_COLOR_1 } from './constants'

import type { ErrorKind } from './types'

interface ErrorRecoveryHeaderProps {
  errorKind: ErrorKind
}
export function ErrorRecoveryHeader({
  errorKind,
}: ErrorRecoveryHeaderProps): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const errorName = useErrorName(errorKind)

  return (
    <Box css={BOX_STYLE}>
      <Flex css={HEADER_CONTAINER_STYLE}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          width="100%"
        >
          <StyledText css={HEADER_TEXT_STYLE}>{t('recovery_mode')}</StyledText>
          <Flex gridGap={SPACING.spacing8}>
            <AlertHeaderIcon />
            <StyledText css={HEADER_TEXT_STYLE}>{errorName}</StyledText>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}

function AlertHeaderIcon(): JSX.Element {
  return (
    <Icon
      name="ot-alert"
      css={css`
        color: ${COLORS.white};
      `}
      size="1.75rem"
    />
  )
}

const BOX_STYLE = css`
  background-color: ${NON_DESIGN_SANCTIONED_COLOR_1};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-radius: ${BORDERS.borderRadius12} ${BORDERS.borderRadius12} 0 0;
  }
`
const HEADER_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing16} ${SPACING.spacing32};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: 1.75rem ${SPACING.spacing32};
  }
`
const HEADER_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  color: ${COLORS.white};
  cursor: default;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    line-height: ${TYPOGRAPHY.lineHeight28};
  }
`
