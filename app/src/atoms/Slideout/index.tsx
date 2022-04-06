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
  POSITION_ABSOLUTE,
  TYPOGRAPHY,
  Overlay,
  StyleProps,
} from '@opentrons/components'

import { Divider } from '../structure'
import { StyledText } from '../text'

interface Props extends StyleProps {
  title: string
  children: React.ReactNode
  onCloseClick: () => unknown
  //  isExpanded is for collapse and expand animation
  isExpanded?: boolean
  footer?: React.ReactNode
}

const EXPANDED_STYLE = css`
  animation-duration: 300ms;
  animation-name: slidein;
  overflow-x: hidden;
  width: 19.5rem;
  max-width: 19.5rem;
  visibility: visible;

  @keyframes slidein {
    from {
      width: 0;
    }
    to {
      width: 19.5rem;
    }
  }
`
const COLLAPSED_STYLE = css`
  animation-duration: 300ms;
  animation-name: slideout;
  animation-direction: alternate;
  overflow: hidden;
  max-width: 0rem;
  visibility: hidden;

  @keyframes slideout {
    from {
      width: 19.5rem;
    }
    to {
      width: 0;
    }
  }
`

export const Slideout = (props: Props): JSX.Element | null => {
  const {
    isExpanded,
    title,
    onCloseClick,
    children,
    footer,
    ...styleProps
  } = props
  return (
    <>
      {isExpanded ? <Overlay /> : null}
      <Box
        css={isExpanded ? EXPANDED_STYLE : COLLAPSED_STYLE}
        position={POSITION_ABSOLUTE}
        right="0"
        top="0"
        backgroundColor={COLORS.white}
        boxShadow={'0px 3px 6px rgba(0, 0, 0, 0.23)'}
        {...styleProps}
      >
        <Flex
          paddingY={SPACING.spacing4}
          width="19.5rem"
          height="100%"
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex flex="1 1 auto" flexDirection={DIRECTION_COLUMN}>
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
              paddingX={SPACING.spacing4}
              marginBottom={SPACING.spacing4}
            >
              <StyledText as="h2" data-testid={`Slideout_title_${title}`}>
                {title}
              </StyledText>
              <Flex alignItems={ALIGN_CENTER}>
                <Btn
                  size={TYPOGRAPHY.lineHeight24}
                  onClick={onCloseClick}
                  aria-label="exit"
                  data-testid={`Slideout_icon_close_${title}`}
                >
                  <Icon name={'close'} />
                </Btn>
              </Flex>
            </Flex>
            <Divider marginY={0} color={COLORS.medGrey} />
            <Box
              padding={SPACING.spacing4}
              flex="1 1 auto"
              data-testid={`Slideout_body_${title}`}
            >
              {children}
            </Box>
          </Flex>
          {footer != null ? (
            <Box paddingX={SPACING.spacing4} flex="0 0 auto">
              {footer}
            </Box>
          ) : null}
        </Flex>
      </Box>
    </>
  )
}
