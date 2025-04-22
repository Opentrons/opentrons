import { useSelector } from 'react-redux'

import { getLabwareEntities } from '../../step-forms/selectors'
import { getHoveredStepLabware } from '../../ui/steps'
import { LabwareLabel } from './LabwareLabel'

import type { LabwareOnDeck } from '../../step-forms'
import type { CoordinateTuple } from '@opentrons/shared-data'

interface HighlightLabwareProps {
  labwareOnDeck: LabwareOnDeck
  position: CoordinateTuple
  isZoomed: boolean
}

export function HighlightLabware(
  props: HighlightLabwareProps
): JSX.Element | null {
  const { labwareOnDeck, position, isZoomed } = props
  const labwareEntities = useSelector(getLabwareEntities)
  const hoveredLabware = useSelector(getHoveredStepLabware)
  const adapterId =
    labwareEntities[labwareOnDeck.slot] != null
      ? labwareEntities[labwareOnDeck.slot].id
      : null

  const highlighted = hoveredLabware.includes(adapterId ?? labwareOnDeck.id)

  if (!isZoomed) {
    return null
  }
  if (highlighted) {
    return (
      <LabwareLabel
        isSelected={true}
        isLast={true}
        position={position}
        labwareDef={labwareOnDeck.def}
      />
    )
  }
  return null
}
