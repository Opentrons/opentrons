import {
  ALIGN_FLEX_START,
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InstrumentDiagram,
  JUSTIFY_CENTER,
  OverflowBtn,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import flexGripper from '/app/assets/images/flex_gripper.png'

import { MenuOverlay } from './MenuOverlay'

import type { ReactNode } from 'react'
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
  banner?: ReactNode
  isEstopNotDisengaged: boolean
}

/**
 * a component for a gripper or pipette instrument
 * TODO(bh, 2022-10-26): explore adding banner section, using within PipetteCard component
 */
export function InstrumentCard(props: InstrumentCardProps): ReactNode {
  const {
    description,
    hasDivider = false,
    instrumentDiagramProps,
    isGripperAttached = false,
    label,
    menuOverlayItems,
    banner,
    isEstopNotDisengaged,
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
      backgroundColor={COLORS.grey10}
      borderRadius={BORDERS.borderRadius8}
      {...styleProps}
    >
      <Flex
        width="100%"
        paddingY={SPACING.spacing16}
        paddingLeft={SPACING.spacing16}
        gridGap={SPACING.spacing8}
      >
        {isGripperAttached ? (
          <Flex
            justifyContent={JUSTIFY_CENTER}
            width="3.75rem"
            height="3.375rem"
          >
            <img src={flexGripper} alt="Flex Gripper" />
          </Flex>
        ) : null}
        {instrumentDiagramProps?.pipetteSpecs != null ? (
          <Flex
            justifyContent={JUSTIFY_CENTER}
            width="3.75rem"
            height="3.375rem"
          >
            <InstrumentDiagram
              pipetteSpecs={instrumentDiagramProps.pipetteSpecs}
              mount={instrumentDiagramProps.mount}
            />
          </Flex>
        ) : null}
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          width="100%"
        >
          {banner}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
            width="100%"
          >
            <StyledText
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              color={COLORS.grey60}
              desktopStyle="bodyDefaultRegular"
            >
              {label}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {description}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
      {menuOverlayItems != null && (
        <>
          <Box alignSelf={ALIGN_START} padding={SPACING.spacing4}>
            <OverflowBtn
              onClick={handleOverflowClick}
              aria-label="InstrumentCard_overflowMenu"
              disabled={isEstopNotDisengaged}
            />
          </Box>
          {showOverflowMenu ? (
            <Flex
              position={POSITION_RELATIVE}
              top={SPACING.spacing4}
              right={SPACING.spacing4}
            >
              <MenuOverlay
                hasDivider={hasDivider}
                menuOverlayItems={menuOverlayItems}
                setShowMenuOverlay={setShowOverflowMenu}
              />
              {menuOverlay}
            </Flex>
          ) : null}
        </>
      )}
    </Flex>
  )
}
