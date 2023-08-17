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
const MODAL_STYLE = css`
  align-items: ${ALIGN_CENTER};
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
const SPINNER_STYLE = css`
  color: ${COLORS.darkGreyEnabled};
  opacity: 100%;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    color: ${COLORS.darkBlackEnabled};
    opacity: 70%;
  }
`

export function InProgressModal(props: Props): JSX.Element {
  const { alternativeSpinner, children, description } = props
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <Flex css={MODAL_STYLE}>
      {alternativeSpinner ?? (
        <Icon
          name="ot-spinner"
          aria-label="spinner"
          size={isOnDevice ? '6.25rem' : '5.125rem'}
          css={SPINNER_STYLE}
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
