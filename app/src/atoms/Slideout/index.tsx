import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  Btn,
  Icon,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  COLORS,
  Overlay,
  POSITION_FIXED,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Divider } from '../structure'
import { StyledText } from '../text'

export interface SlideoutProps {
  title: string | React.ReactElement
  children: React.ReactNode
  onCloseClick: () => unknown
  //  isExpanded is for collapse and expand animation
  isExpanded?: boolean
  footer?: React.ReactNode
}

const SHARED_STYLE = css`
  z-index: 2;
  overflow: hidden;
  @keyframes slidein {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes slideout {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }
  @keyframes overlayin {
    from {
      opacity: 0;
    }
    to {
      opacity: 0.35;
    }
  }
  @keyframes overlayout {
    from {
      opacity: 0.35;
      visibility: visible;
    }
    to {
      opacity: 0;
      visibility: hidden;
    }
  }
`
const EXPANDED_STYLE = css`
  ${SHARED_STYLE}
  animation: slidein 300ms forwards;
`
const COLLAPSED_STYLE = css`
  ${SHARED_STYLE}
  animation: slideout 300ms forwards;
`
const INITIALLY_COLLAPSED_STYLE = css`
  ${SHARED_STYLE}
  animation: slideout 0ms forwards;
`
const OVERLAY_IN_STYLE = css`
  ${SHARED_STYLE}
  animation: overlayin 300ms forwards;
`
const OVERLAY_OUT_STYLE = css`
  ${SHARED_STYLE}
  animation: overlayout 300ms forwards;
`
const INITIALLY_OVERLAY_OUT_STYLE = css`
  ${SHARED_STYLE}
  animation: overlayout 0ms forwards;
`

const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: ${COLORS.lightGreyHover};
  }
  &:active {
    background: ${COLORS.lightGreyPressed};
  }
`

export const Slideout = (props: SlideoutProps): JSX.Element => {
  const { isExpanded, title, onCloseClick, children, footer } = props
  const slideOutRef = React.useRef<HTMLDivElement>(null)
  const [isReachedBottom, setIsReachedBottom] = React.useState<boolean>(false)

  const hasBeenExpanded = React.useRef<boolean>(isExpanded ?? false)
  const handleScroll = (): void => {
    if (slideOutRef.current == null) return
    const { scrollTop, scrollHeight, clientHeight } = slideOutRef.current
    if (scrollTop + clientHeight === scrollHeight) {
      setIsReachedBottom(true)
    } else {
      setIsReachedBottom(false)
    }
  }

  React.useEffect(() => {
    handleScroll()
  }, [slideOutRef])

  const handleClose = (): void => {
    hasBeenExpanded.current = true
    onCloseClick()
  }

  const collapsedStyle = hasBeenExpanded.current
    ? COLLAPSED_STYLE
    : INITIALLY_COLLAPSED_STYLE
  const overlayOutStyle = hasBeenExpanded.current
    ? OVERLAY_OUT_STYLE
    : INITIALLY_OVERLAY_OUT_STYLE
  return (
    <>
      <Overlay
        onClick={handleClose}
        css={`
          ${isExpanded ?? false ? OVERLAY_IN_STYLE : overlayOutStyle}
        `}
        backgroundColor={COLORS.darkBlackEnabled}
      />
      <Box
        css={isExpanded ?? false ? EXPANDED_STYLE : collapsedStyle}
        cursor="auto"
        position={POSITION_FIXED}
        right="0"
        top="0"
        backgroundColor={COLORS.white}
        boxShadow="0px 3px 6px rgba(0, 0, 0, 0.23)"
        height="100%"
      >
        <Flex
          paddingY={SPACING.spacing16}
          width="19.5rem"
          height="100%"
          flex="0 1 auto"
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          {typeof title === 'string' ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
              paddingX={SPACING.spacing16}
              marginBottom={SPACING.spacing16}
            >
              <StyledText
                as="h2"
                overflowWrap="anywhere"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                data-testid={`Slideout_title_${title}`}
              >
                {title}
              </StyledText>
              <Flex alignItems={ALIGN_CENTER}>
                <Btn
                  size="1.5rem"
                  onClick={handleClose}
                  aria-label="exit"
                  data-testid={`Slideout_icon_close_${
                    typeof title === 'string' ? title : ''
                  }`}
                >
                  <Icon name="close" css={CLOSE_ICON_STYLE} />
                </Btn>
              </Flex>
            </Flex>
          ) : (
            <>{title}</>
          )}
          <Divider marginY={0} color={COLORS.medGreyEnabled} />
          <Box
            padding={SPACING.spacing16}
            flex="1 1 auto"
            overflowY="scroll"
            data-testid={`Slideout_body_${
              typeof title === 'string' ? title : ''
            }`}
            ref={slideOutRef}
            onScroll={handleScroll}
          >
            {children}
          </Box>
          {footer != null ? (
            <Box
              paddingTop={SPACING.spacing16}
              paddingX={SPACING.spacing16}
              flex="0 0 auto"
              boxShadow={isReachedBottom ? 'none' : '0px -4px 12px #0000001a'}
              zIndex="3"
            >
              {footer}
            </Box>
          ) : null}
        </Flex>
      </Box>
    </>
  )
}
