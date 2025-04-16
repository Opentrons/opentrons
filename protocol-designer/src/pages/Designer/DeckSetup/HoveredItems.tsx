import { Fragment } from 'react'
import { useSelector } from 'react-redux'
import { LabwareRender } from '@opentrons/components'
import { selectors } from '../../../labware-ingred/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { LabwareLabel } from '../LabwareLabel'
import type { DeckLabelProps } from '@opentrons/components'
import type { CoordinateTuple } from '@opentrons/shared-data'

interface HoveredLabwareProps {
  hoveredLabware: string | null
  hoveredSlotPosition: CoordinateTuple | null
}
export const HoveredItems = (
  props: HoveredLabwareProps
): JSX.Element | null => {
  const { hoveredLabware, hoveredSlotPosition } = props
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedModuleModel, selectedLabwareDefUri } = selectedSlotInfo

  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()

  if (hoveredSlotPosition == null) {
    return null
  }
  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null
  const selectedLabwareDef =
    selectedLabwareDefUri != null
      ? defs[selectedLabwareDefUri] ?? customLabwareDefs[selectedLabwareDefUri]
      : null

  const nestedInfo: DeckLabelProps[] =
    selectedLabwareDef != null &&
    (hoveredLabware == null || hoveredLabware !== selectedLabwareDefUri)
      ? [
          {
            text: selectedLabwareDef.metadata.displayName,
            isLast: false,
            isSelected: true,
            isZoomed: true,
          },
        ]
      : []

  return hoveredLabwareDef != null &&
    hoveredSlotPosition != null &&
    hoveredLabware != null &&
    selectedModuleModel == null ? (
    <Fragment key={`${hoveredLabwareDef.parameters.loadName}_hover`}>
      <g
        transform={`translate(${hoveredSlotPosition[0]}, ${hoveredSlotPosition[1]})`}
      >
        <LabwareRender definition={hoveredLabwareDef} />
      </g>
      <LabwareLabel
        isLast={true}
        isSelected={false}
        labwareDef={hoveredLabwareDef}
        position={hoveredSlotPosition}
        nestedLabwareInfo={nestedInfo}
      />
    </Fragment>
  ) : null
}
