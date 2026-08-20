import { RobotCoordsForeignDiv } from '@opentrons/components'

import { DECK_CONTROLS_STYLE_BASE } from '/protocol-designer/pages/Designer/DeckSetup/constants'

import styles from './tipselectionwizard.module.css'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
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
): ReactNode {
  const slotFill = <div className={styles.slot_fill} />

  const { slotPosition, setHover, labware, onClick } = props
  const { def } = labware
  const { xDimension, yDimension } = def.dimensions
  const { cornerOffsetFromSlot } = def
  const { x: xOffset, y: yOffset } = cornerOffsetFromSlot
  return (
    <RobotCoordsForeignDiv
      {...{
        x: slotPosition[0] + xOffset,
        y: slotPosition[1] + yOffset,
        width: xDimension,
        height: yDimension,
      }}
      innerDivProps={DECK_CONTROLS_STYLE_BASE}
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
