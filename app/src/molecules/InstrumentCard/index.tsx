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
import flexGripper from '../../assets/images/flex_gripper.png'

import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../atoms/text'
import { MenuOverlay } from './MenuOverlay'

import type { InstrumentDiagramProps, StyleProps } from '@opentrons/components'
import type { MenuOverlayItemProps } from './MenuOverlay'

interface InstrumentCardProps extends StyleProps {
  description: string
  label: string
  menuOverlayItems?: MenuOverlayItemProps[]
  hasDivider?: boolean
  instrumentDiagramProps?: InstrumentDiagramProps
  // special casing the gripper at least for now
  isGripperAttached?: boolean
  banner?: React.ReactNode
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
    banner,
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
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
      position={POSITION_RELATIVE}
      {...styleProps}
    >
      {isGripperAttached ? (
        <Flex
          justifyContent={JUSTIFY_CENTER}
          backgroundColor={COLORS.lightGreyHover}
          width="3.75rem"
          height="3.75rem"
        >
          <img src={flexGripper} alt="flex gripper" />
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
        gridGap={SPACING.spacing2}
        paddingRight={SPACING.spacing24}
      >
        {banner}
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
      {menuOverlayItems != null && (
        <Box
          position={POSITION_ABSOLUTE}
          top={SPACING.spacing4}
          right={SPACING.spacing4}
        >
          <OverflowBtn
            onClick={handleOverflowClick}
            aria-label="InstrumentCard_overflowMenu"
          />
          {menuOverlay}
          {showOverflowMenu ? (
            <MenuOverlay
              hasDivider={hasDivider}
              menuOverlayItems={menuOverlayItems}
              setShowMenuOverlay={setShowOverflowMenu}
            />
          ) : null}
        </Box>
      )}
    </Flex>
  )
}
