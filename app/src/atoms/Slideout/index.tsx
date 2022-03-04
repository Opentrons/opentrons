import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  Text,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  Btn,
  Icon,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_3,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  COLORS,
  POSITION_ABSOLUTE,
  TYPOGRAPHY,
  Overlay,
  StyleProps,
} from '@opentrons/components'

import { Divider } from '../structure'

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
  overflow: hidden;
  width: 19.5rem;
  max-width: 19.5rem;
  height: 100%;

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
          paddingY={SPACING_3}
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
              paddingX={SPACING_3}
              marginBottom={SPACING_3}
            >
              <Text
                fontSize={TYPOGRAPHY.fontSizeH2}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                data-testid={`Slideout_title_${title}`}
              >
                {title}
              </Text>
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
              padding={SPACING_3}
              flex="1 1 auto"
              data-testid={`Slideout_body_${title}`}
            >
              {children}
            </Box>
          </Flex>
          {footer != null ? (
            <Box paddingX={SPACING_3} flex="0 0 auto">
              {footer}
            </Box>
          ) : null}
        </Flex>
      </Box>
    </>
  )
}
