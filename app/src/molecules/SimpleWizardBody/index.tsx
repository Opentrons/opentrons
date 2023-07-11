import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  RESPONSIVENESS,
  ALIGN_CENTER,
  StyleProps,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { Skeleton } from '../../atoms/Skeleton'

interface Props extends StyleProps {
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
  margin-top: ${SPACING.spacing24};
  margin-bottom: ${SPACING.spacing8};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 2rem;
    font-weight: 700;
    line-height: ${SPACING.spacing40};
  }
`
const SUBHEADER_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  margin-left: 6.25rem;
  margin-right: 6.25rem;
  text-align: ${TYPOGRAPHY.textAlignCenter};
  height: 1.75rem;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize28};
    line-height: ${TYPOGRAPHY.lineHeight36};
    margin-left: 4.5rem;
    margin-right: 4.5rem;
  }
`
const BUTTON_STYLE = css`
  width: 100%;
  justify-content: ${JUSTIFY_FLEX_END};
  padding-right: ${SPACING.spacing32};
  padding-bottom: ${SPACING.spacing32};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    padding-bottom: ${SPACING.spacing32};
    padding-left: ${SPACING.spacing32};
  }
`
const WIZARD_CONTAINER_STYLE = css`
  min-height: 394px;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  height: 'auto';
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 472px;
  }
`
const FLEX_SPACING_STYLE = css`
  height: 1.75rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 0rem;
  }
`

export function SimpleWizardBody(props: Props): JSX.Element {
  const {
    iconColor,
    children,
    header,
    subHeader,
    isSuccess,
    isPending,
    ...styleProps
  } = props
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <Flex css={WIZARD_CONTAINER_STYLE} {...styleProps}>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        flexDirection={DIRECTION_COLUMN}
        flex="1 0 auto"
      >
        {isPending ? (
          <Flex
            gridGap={SPACING.spacing24}
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
              size={isOnDevice ? '3.75rem' : '2.5rem'}
              color={iconColor}
              aria-label={isSuccess ? 'ot-check' : 'ot-alert'}
            />
            <StyledText css={HEADER_STYLE}>{header}</StyledText>
            {subHeader != null ? (
              <StyledText css={SUBHEADER_STYLE}>{subHeader}</StyledText>
            ) : (
              <Flex aria-label="flex_spacing" css={FLEX_SPACING_STYLE} />
            )}
          </>
        )}
      </Flex>
      <Flex
        position={POSITION_ABSOLUTE}
        bottom={0}
        right={0}
        css={BUTTON_STYLE}
      >
        {children}
      </Flex>
    </Flex>
  )
}
