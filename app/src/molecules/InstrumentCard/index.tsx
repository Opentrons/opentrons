import * as React from 'react'

import {
  Box,
  Flex,
  InstrumentDiagram,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../atoms/text'
import { MenuOverlay } from './MenuOverlay'

import type { InstrumentDiagramProps, StyleProps } from '@opentrons/components'
import type { MenuOverlayItemProps } from './MenuOverlay'

interface InstrumentCardProps extends StyleProps {
  description: string
  label: string
  menuOverlayItems: MenuOverlayItemProps[]
  hasDivider?: boolean
  instrumentDiagramProps?: InstrumentDiagramProps
  // special casing the gripper at least for now
  isGripperAttached?: boolean
}

/**
 * a component for a gripper or pipette instrument
 * TODO(bh, 2022-10-26): explore adding banner section, using within PipetteCard component
 */
export function InstrumentCard(props: InstrumentCardProps): JSX.Element {
  const {
    description,
    hasDivider = false,
    instrumentDiagramProps,
    isGripperAttached = false,
    label,
    menuOverlayItems,
    ...styleProps
  } = props

  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.fundamentalsBackground}
      borderRadius={BORDERS.radiusSoftCorners}
      gridGap={SPACING.spacing3}
      padding={SPACING.spacing4}
      position={POSITION_RELATIVE}
      {...styleProps}
    >
      {isGripperAttached ? (
        // TODO(bh, 2022-10-26): temp "greyed-out" pipette image, update with gripper image when available
        <Flex
          justifyContent={JUSTIFY_CENTER}
          backgroundColor={COLORS.lightGreyHover}
          width="3.75rem"
          height="3.75rem"
        >
          <InstrumentDiagram
            pipetteSpecs={{ displayCategory: 'GEN1', channels: 1 }}
            mount="left"
            opacity="0.17"
            transform="scale(0.3)"
            size="3.125rem"
            transformOrigin="20% -10%"
          />
        </Flex>
      ) : null}
      {instrumentDiagramProps?.pipetteSpecs != null ? (
        <InstrumentDiagram
          pipetteSpecs={instrumentDiagramProps.pipetteSpecs}
          mount={instrumentDiagramProps.mount}
          transform="scale(0.3)"
          size="3.125rem"
          transformOrigin="20% -10%"
        />
      ) : null}
      <Flex
        alignItems={ALIGN_FLEX_START}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing1}
        paddingRight={SPACING.spacing5}
      >
        <StyledText
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH6}
        >
          {label}
        </StyledText>
        <StyledText as="p" textTransform={TYPOGRAPHY.textTransformCapitalize}>
          {description}
        </StyledText>
      </Flex>
      <Box
        position={POSITION_ABSOLUTE}
        top={SPACING.spacing2}
        right={SPACING.spacing2}
      >
        <OverflowBtn onClick={handleOverflowClick} />
        {menuOverlay}
        {showOverflowMenu ? (
          <MenuOverlay
            hasDivider={hasDivider}
            menuOverlayItems={menuOverlayItems}
            setShowMenuOverlay={setShowOverflowMenu}
          />
        ) : null}
      </Box>
    </Flex>
  )
}
