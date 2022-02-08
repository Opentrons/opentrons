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
} from '@opentrons/components'

import { Divider } from '../structure'

interface Props {
  title: string
  children: React.ReactNode
  //  isExpanded is for collapse and expand animation
  isExpanded?: boolean
}

const EXPANDED_STYLE = css`
  animation-duration: 300ms;
  animation-name: slidein;s
  overflow: hidden;
  max-width: 19.5rem;

  @keyframes slidein {
    from {
      margin-left: 100%;
      width: 300%;
    }
    to {
      margin-left: 0%;
      width: 100%;
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
      margin-left: 0%;
      width: 100%;
    }
    to {
      margin-left: 100%;
      width: 300%;
    }
  }
`

export const Slideout = (props: Props): JSX.Element | null => {
  const [hideSlideOut, setHideSlideOut] = React.useState(false)

  if (hideSlideOut) return null

  return (
    <>
      <Box
        css={props.isExpanded ? EXPANDED_STYLE : COLLAPSED_STYLE}
        position="absolute"
        right="0"
        top="0"
        backgroundColor={COLORS.white}
        //  TODO Immediately: add this boxShadow to the new typography standards once it is made!
        boxShadow="0px 3px 6px rgba(0, 0, 0, 0.23)"
        borderRadius={SPACING_1}
      >
        <Flex padding={SPACING_3} flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Text
              //  TODO immediately: add this fontSize to typography standard
              fontSize="0.937rem"
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              data-testid={`Slideout_title_${props.title}`}
            >
              {props.title}
            </Text>
            <Flex alignItems={ALIGN_CENTER}>
              <Btn
                size={'1.5rem'}
                onClick={() => setHideSlideOut(true)}
                aria-label="exit"
                data-testid={`Slideout_icon_close_${props.title}`}
              >
                <Icon name={'close'} />
              </Btn>
            </Flex>
          </Flex>
        </Flex>
        <Divider margin={SPACING_1} color="#e3e3e3" />
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
