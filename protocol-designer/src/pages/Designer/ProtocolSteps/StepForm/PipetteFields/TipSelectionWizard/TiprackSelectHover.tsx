import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignDiv,
  SPACING,
} from '@opentrons/components'

import { DECK_CONTROLS_STYLE } from '/protocol-designer/pages/Designer/DeckSetup/constants'

import type { Dispatch, SetStateAction } from 'react'
import type { CoordinateTuple } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'

interface TiprackSelectHoverProps {
  slotPosition: CoordinateTuple
  labware: LabwareOnDeck
  setHover: Dispatch<SetStateAction<string | null>>
  onClick: () => void
}

export function TiprackSelectHover(
  props: TiprackSelectHoverProps
): JSX.Element {
  const slotFill = (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={`${COLORS.black90}cc`}
      borderRadius={BORDERS.borderRadius4}
      color={COLORS.white}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="100%"
    />
  )

  const { slotPosition, setHover, labware, onClick } = props
  const { def } = labware
  const { xDimension, yDimension } = def.dimensions
  const { cornerOffsetFromSlot } = def
  const { x: xOffset, y: yOffset } = cornerOffsetFromSlot
  const opacity = 0
  return (
    <RobotCoordsForeignDiv
      {...{
        x: slotPosition[0] + xOffset,
        y: slotPosition[1] + yOffset,
        width: xDimension,
        height: yDimension,
      }}
      innerDivProps={{
        opacity: opacity,
        ...DECK_CONTROLS_STYLE,
        zIndex: 20,
        cursor: CURSOR_POINTER,
        backgroundColor: 'black',
      }}
      innerDivEvents={{
        onMouseEnter: () => {
          setHover(labware.id)
        },
        onMouseLeave: () => {
          setHover(null)
        },
        onClick,
      }}
    >
      {slotFill}
    </RobotCoordsForeignDiv>
  )
}
