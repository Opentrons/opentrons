import * as React from 'react'
import { css } from 'styled-components'
import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  Flex,
  Icon,
  RESPONSIVENESS,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { getIsOnDevice } from '../../redux/config'

interface Props {
  //  optional override of the spinner
  alternativeSpinner?: React.ReactNode
  description?: string
  children?: JSX.Element
}

const DESCRIPTION_STYLE = css`
  ${TYPOGRAPHY.h1Default}
  margin-top: ${SPACING.spacing24};
  margin-bottom: ${SPACING.spacing8};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    font-size: ${TYPOGRAPHY.fontSize32};
    margin-top: ${SPACING.spacing32};
    margin-bottom: ${SPACING.spacing4};
    margin-left: 4.5rem;
    margin-right: 4.5rem;
    text-align: ${TYPOGRAPHY.textAlignCenter};
    line-height: ${TYPOGRAPHY.lineHeight42};
  }
`
export function InProgressModal(props: Props): JSX.Element {
  const { alternativeSpinner, children, description } = props
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      height={isOnDevice ? '31.5625rem' : '24.625rem'}
      padding={SPACING.spacing32}
    >
      {alternativeSpinner ?? (
        <Icon
          name="ot-spinner"
          aria-label="spinner"
          size={isOnDevice ? '6.25rem' : '5.125rem'}
          color={isOnDevice ? COLORS.darkBlackEnabled : COLORS.darkGreyEnabled}
          opacity={isOnDevice ? '70%' : '100%'}
          spin
        />
      )}
      {description != null && (
        <StyledText css={DESCRIPTION_STYLE}>{description}</StyledText>
      )}
      {children}
    </Flex>
  )
}
