import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_CENTER,
  COLORS,
  Icon,
  Flex,
  StyledText,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  RESPONSIVENESS,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import type { DropTipWizardContainerProps } from './types'

export function ErrorInfo({
  errorComponents,
  errorDetails,
}: DropTipWizardContainerProps): JSX.Element {
  const { button, subHeader } = errorComponents
  const { t } = useTranslation('drop_tip_wizard')

  return (
    <>
      <Flex css={CONTAINER_STYLE}>
        <Icon name="alert-circle" css={ICON_STYLE} color={COLORS.red50} />
        <StyledText oddStyle="level3HeaderBold" desktopStyle="headingSmallBold">
          {errorDetails?.header ?? t('error_dropping_tips')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          oddStyle="level4HeaderRegular"
        >
          {subHeader}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>{button}</Flex>
    </>
  )
}

const CONTAINER_STYLE = css`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  padding: ${SPACING.spacing40} ${SPACING.spacing16};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  text-align: ${TEXT_ALIGN_CENTER};
  margin-top: ${SPACING.spacing16};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing24};
    padding: ${SPACING.spacing40};
  }
`

const ICON_STYLE = css`
  width: 40px;
  height: 40px;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 60px;
    height: 60px;
  }
`
