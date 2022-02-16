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
} from '@opentrons/components'
import { TitleBar, TitleBarProps } from '../TitleBar'

function Overlay(): JSX.Element {
  return (
    <Flex
      position={POSITION_ABSOLUTE}
      left="0"
      right="0"
      top="0"
      bottom="0"
      backgroundColor={COLORS.white}
    />
  )
}

export interface ModalPageProps {
  titleBar: TitleBarProps
  contentsClassName?: string
  heading?: React.ReactNode
  children?: React.ReactNode
  innerProps?: React.ComponentProps<typeof Box>
  outerProps?: React.ComponentProps<typeof Box>
}

export function ModalPage(props: ModalPageProps): JSX.Element {
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
      padding={`2.5rem 3rem ${TYPOGRAPHY.lineHeight16} 3rem`}
      data-testid={`modal_page`}
      {...outerProps}
    >
      <Overlay />

      <TitleBar {...titleBar} />
      <Box
        zIndex="1"
        width="42.125rem"
        margin="0 auto"
        padding={TYPOGRAPHY.lineHeight16}
        position={POSITION_RELATIVE}
        boxShadow={TYPOGRAPHY.boxShadowSM}
        border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
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
