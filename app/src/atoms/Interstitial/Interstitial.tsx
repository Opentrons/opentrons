import * as React from 'react'
import {
  Box,
  Flex,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_START,
  POSITION_RELATIVE,
  COLORS,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  SPACING,
  Overlay,
} from '@opentrons/components'
import {
  InterstitialTitleBar,
  InterstitialTitleBarProps,
} from './InterstitiallTitleBar'
export interface InterstitialProps {
  titleBar: InterstitialTitleBarProps
  contentsClassName?: string
  heading?: React.ReactNode
  children?: React.ReactNode
  innerProps?: React.ComponentProps<typeof Box>
  outerProps?: React.ComponentProps<typeof Box>
}

export function Interstitial(props: InterstitialProps): JSX.Element {
  const { titleBar, heading, innerProps = {}, outerProps = {} } = props

  return (
    <Box
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_ABSOLUTE}
      left="0"
      right="0"
      top="0"
      bottom="0"
      justifyContent={JUSTIFY_FLEX_START}
      padding={`2.5rem 3rem 1rem 3rem`}
      data-testid={`interstitial`}
      {...outerProps}
    >
      <Overlay backgroundColor={COLORS.white} opacity={1} />

      <InterstitialTitleBar {...titleBar} />
      <Box
        zIndex="1"
        width="auto"
        margin="0 auto"
        padding={SPACING.spacing4}
        position={POSITION_RELATIVE}
        boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.3)'}
        border={`1px solid ${COLORS.medGrey}`}
        backgroundColor={COLORS.white}
        maxHeight="100%"
        overflowY="auto"
        paddingTop={TYPOGRAPHY.lineHeight16}
        {...innerProps}
      >
        {heading && (
          <Flex
            marginTop="0"
            marginBottom={TYPOGRAPHY.lineHeight16}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            fontWeight={TYPOGRAPHY.fontWeightBold}
          >
            <h3>{heading}</h3>
          </Flex>
        )}
        {props.children}
      </Box>
    </Box>
  )
}
