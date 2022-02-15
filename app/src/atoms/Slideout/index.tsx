import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  SPACING_1,
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
} from '@opentrons/components'

import { Divider } from '../structure'

interface Props {
  title: string
  children: React.ReactNode
  onCloseClick: () => unknown
  //  isExpanded is for collapse and expand animation
  isExpanded?: boolean
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
  return (
    <>
      <Overlay />
      <Box
        css={props.isExpanded ? EXPANDED_STYLE : COLLAPSED_STYLE}
        position={POSITION_ABSOLUTE}
        right="0"
        top="0"
        backgroundColor={COLORS.white}
        boxShadow={'0px 3px 6px rgba(0, 0, 0, 0.23)'}
        borderRadius={SPACING_1}
      >
        <Flex padding={SPACING_3} flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Text
              fontSize={TYPOGRAPHY.fontSizeH2}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              data-testid={`Slideout_title_${props.title}`}
            >
              {props.title}
            </Text>
            <Flex alignItems={ALIGN_CENTER}>
              <Btn
                size={TYPOGRAPHY.lineHeight24}
                onClick={props.onCloseClick}
                aria-label="exit"
                data-testid={`Slideout_icon_close_${props.title}`}
              >
                <Icon name={'close'} />
              </Btn>
            </Flex>
          </Flex>
        </Flex>
        <Divider margin={SPACING_1} color={COLORS.medGrey} />
        <Flex
          padding={SPACING_3}
          flexDirection={DIRECTION_COLUMN}
          data-testid={`Slideout_body_${props.title}`}
        >
          {props.children}
        </Flex>
      </Box>
    </>
  )
}
