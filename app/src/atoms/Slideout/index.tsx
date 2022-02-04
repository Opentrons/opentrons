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
} from '@opentrons/components'

import { Portal } from '../../App/__mocks__/portal'
import { Divider } from '../structure'

interface Props {
  title: string
  children: React.ReactNode
  //  isExpanded is for collapse and expand animation
  isExpanded?: boolean
}

const EXPANDED_STYLE = css`
  transition: max-height 300ms ease-in, visibility 400ms ease;
  visibility: visible;
  max-height: 100vh;
  overflow: hidden;
`
const COLLAPSED_STYLE = css`
  transition: max-height 500ms ease-out;
  visibility: hidden;
  max-height: 0vh;
  overflow: hidden;
`

export const Slideout = (props: Props): JSX.Element | null => {
  const [hideSlideOut, setHideSlideOut] = React.useState(false)

  if (hideSlideOut) return null

  return (
    <>
      <Portal>
        <Box
          css={props.isExpanded ? EXPANDED_STYLE : COLLAPSED_STYLE}
          width="19.5rem"
          boxShadow="0px 3px 6px rgba(0, 0, 0, 0.23)"
          borderRadius={SPACING_1}
        >
          <Flex padding={SPACING_3} flexDirection={DIRECTION_COLUMN}>
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <Text
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
      </Portal>
    </>
  )
}
