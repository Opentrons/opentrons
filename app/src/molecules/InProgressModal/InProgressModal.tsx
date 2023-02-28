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
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { ODD_MEDIA_QUERY_SPECS } from '@opentrons/shared-data'
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
  margin-top: ${SPACING.spacing5};
  margin-bottom: ${SPACING.spacing3};

  @media ${ODD_MEDIA_QUERY_SPECS} {
    font-weight: 700;
    font-size: 2rem;
    margin-top: ${SPACING.spacing6};
    margin-bottom: ${SPACING.spacing2};
    margin-left: 4.5rem;
    margin-right: 4.5rem;
    text-align: ${TEXT_ALIGN_CENTER};
    line-height: 2.625rem;
  }
`
export function InProgressModal(props: Props): JSX.Element {
  const { alternativeSpinner, children, description } = props
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      marginY="8rem"
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
