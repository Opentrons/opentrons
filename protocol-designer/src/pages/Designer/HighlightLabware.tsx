import { useSelector } from 'react-redux'

import { getTopLocationInStack } from '@opentrons/step-generation'

import { getHoveredStepLabware } from '../../ui/steps'
import { LabwareLabel } from './LabwareLabel'

import type { ReactNode } from 'react'
import type { CoordinateTuple } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../step-forms'

interface HighlightLabwareProps {
  labwareOnDeck: LabwareOnDeck
  position: CoordinateTuple
  isZoomed: boolean
}

export function HighlightLabware(props: HighlightLabwareProps): ReactNode {
  const { labwareOnDeck, position, isZoomed } = props
  const hoveredLabware = useSelector(getHoveredStepLabware)
  const highlighted = hoveredLabware.includes(
    getTopLocationInStack(labwareOnDeck.stack)
  )

  if (!isZoomed) {
    return null
  }
  if (highlighted) {
    return (
      <LabwareLabel
        isSelected={true}
        isLast={true}
        position={position}
        showModuleIcon={false}
        labwareDef={labwareOnDeck.def}
      />
    )
  }
  return null
}
