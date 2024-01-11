import * as React from 'react'
import {
  Box,
  Flex,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_START,
  POSITION_RELATIVE,
  LEGACY_COLORS,
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
      padding={`${SPACING.spacing40} ${SPACING.spacing48} ${SPACING.spacing16} ${SPACING.spacing48}`}
      data-testid="interstitial"
      {...outerProps}
    >
      <Overlay backgroundColor={LEGACY_COLORS.white} />

      <InterstitialTitleBar {...titleBar} />
      <Box
        zIndex="1"
        width="auto"
        margin="0 auto"
        padding={SPACING.spacing16}
        position={POSITION_RELATIVE}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.3)"
        border={`1px solid ${String(LEGACY_COLORS.medGreyEnabled)}`}
        backgroundColor={LEGACY_COLORS.white}
        maxHeight="100%"
        overflowY="auto"
        paddingTop={SPACING.spacing16}
        {...innerProps}
      >
        {heading != null ? (
          <Flex
            marginTop="0"
            marginBottom={SPACING.spacing16}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            fontWeight={TYPOGRAPHY.fontWeightBold}
          >
            <h3>{heading}</h3>
          </Flex>
        ) : null}
        {props.children}
      </Box>
    </Box>
  )
}
