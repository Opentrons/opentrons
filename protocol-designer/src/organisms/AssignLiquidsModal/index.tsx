import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { selectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import {
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Toolbox,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import type { WellGroup } from '@opentrons/components'
import { getSelectedWells } from '../../well-selection/selectors'
import {
  SelectableLabware,
  wellFillFromWellContents,
} from '../../components/labware'
import { deselectWells, selectWells } from '../../well-selection/actions'
import { LiquidToolbox } from './LiquidToolbox'
import { createPortal } from 'react-dom'
import { getTopPortalEl } from '../../components/portals/TopPortal'
interface AssignLiquidsModalProps {
  onClose: () => void
}
export function AssignLiquidsModal(
  props: AssignLiquidsModalProps
): JSX.Element | null {
  const { onClose } = props
  const [highlightedWells, setHighlightedWells] = React.useState<
    WellGroup | {}
  >({})
  const labwareId = useSelector(selectors.getSelectedLabwareId)
  const selectedWells = useSelector(getSelectedWells)
  const dispatch = useDispatch()
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsAllLabware
  )
  console.log('labwareId', labwareId)
  const liquidNamesById = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  if (labwareId == null) {
    console.assert(
      false,
      'LiquidPlacementModal: No labware is selected, and no labwareId was given to modal'
    )
    return null
  }

  const labwareDef = labwareEntities[labwareId]?.def
  const wellContents = allWellContents[labwareId]

  return createPortal(
    <Flex backgroundColor={COLORS.grey10}>
      {labwareDef && (
        <SelectableLabware
          labwareProps={{
            wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
            definition: labwareDef,
            highlightedWells: highlightedWells,
            wellFill: wellFillFromWellContents(
              wellContents,
              liquidDisplayColors
            ),
          }}
          selectedPrimaryWells={selectedWells}
          selectWells={(wells: WellGroup) => dispatch(selectWells(wells))}
          deselectWells={(wells: WellGroup) => dispatch(deselectWells(wells))}
          updateHighlightedWells={(wells: WellGroup) => {
            setHighlightedWells(wells)
          }}
          ingredNames={liquidNamesById}
          wellContents={wellContents}
          nozzleType={null}
        />
      )}
      <LiquidToolbox onClose={onClose} />
    </Flex>,
    getTopPortalEl()
  )
}
