import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ODD_MEDIA_QUERY_SPECS } from '@opentrons/shared-data'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { Skeleton } from '../../atoms/Skeleton'

interface Props {
  iconColor: string
  header: string
  isSuccess: boolean
  children?: React.ReactNode
  subHeader?: string
  isPending?: boolean
}
const BACKGROUND_SIZE = '47rem'

const HEADER_STYLE = css`
  ${TYPOGRAPHY.h1Default};
  margin-top: ${SPACING.spacing5};
  margin-bottom: ${SPACING.spacing3};

  @media ${ODD_MEDIA_QUERY_SPECS} {
    font-size: 2rem;
    font-weight: 700;
  }
`
const SUBHEADER_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  margin-left: 6.25rem;
  margin-right: 6.25rem;
  text-align: ${ALIGN_CENTER};
  height: 1.75rem;

  @media ${ODD_MEDIA_QUERY_SPECS} {
    font-size: 1.75rem;
    line-height: 2.25rem;
    margin-left: 4.5rem;
    margin-right: 4.5rem;
  }
`
const BUTTON_STYLE = css`
  justify-content: ${JUSTIFY_FLEX_END};
  padding-right: ${SPACING.spacing6};
  padding-bottom: ${SPACING.spacing6};

  @media ${ODD_MEDIA_QUERY_SPECS} {
    padding-bottom: 2rem;
  }
`

export function SimpleWizardBody(props: Props): JSX.Element {
  const { iconColor, children, header, subHeader, isSuccess, isPending } = props
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        marginBottom={isOnDevice ? '3.9365rem' : '5.6875rem'}
        marginTop="6.8125rem"
      >
        {isPending ? (
          <Flex
            gridGap={SPACING.spacing5}
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Skeleton
              width="6.25rem"
              height="6.25rem"
              backgroundSize={BACKGROUND_SIZE}
            />
            <Skeleton
              width="18rem"
              height="1.125rem"
              backgroundSize={BACKGROUND_SIZE}
            />
          </Flex>
        ) : (
          <>
            <Icon
              name={isSuccess ? 'ot-check' : 'ot-alert'}
              size={isOnDevice ? '11.25rem' : '2.5rem'}
              color={iconColor}
              aria-label={isSuccess ? 'ot-check' : 'ot-alert'}
            />
            <StyledText css={HEADER_STYLE}>{header}</StyledText>
            {subHeader != null ? (
              <StyledText css={SUBHEADER_STYLE}>{subHeader}</StyledText>
            ) : (
              <Flex
                aria-label="flex_spacing"
                height={isOnDevice ? '0rem' : '1.75rem'}
              />
            )}
          </>
        )}
      </Flex>
      <Flex css={BUTTON_STYLE}>{children}</Flex>
    </Flex>
  )
}
