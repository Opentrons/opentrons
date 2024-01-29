import * as React from 'react'
import assert from 'assert'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import isEmpty from 'lodash/isEmpty'
import { WellGroup, WELL_LABEL_OPTIONS } from '@opentrons/components'

import {
  wellFillFromWellContents,
  SelectableLabware,
} from '../components/labware'
import { selectors } from '../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../step-forms'
import * as wellContentsSelectors from '../top-selectors/well-contents'
import { getSelectedWells } from '../well-selection/selectors'
import { selectWells, deselectWells } from '../well-selection/actions'
import { LiquidPlacementForm } from './LiquidPlacementForm/LiquidPlacementForm'
import { WellSelectionInstructions } from './WellSelectionInstructions'

import styles from './LiquidPlacementModal.module.css'

export function LiquidPlacementModal(): JSX.Element {
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
  const liquidNamesById = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  if (labwareId == null) {
    assert(
      false,
      'LiquidPlacementModal: No labware is selected, and no labwareId was given to LiquidPlacementModal'
    )
  }

  const labwareDef = labwareEntities[labwareId]?.def
  const wellContents = allWellContents[labwareId]

  return (
    <div
      className={cx(styles.liquid_placement_modal, {
        [styles.expanded]: !isEmpty(selectedWells),
      })}
    >
      <LiquidPlacementForm />

      {labwareDef && (
        <div className={styles.labware}>
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
            updateHighlightedWells={(wells: WellGroup) =>
              setHighlightedWells(wells)
            }
            ingredNames={liquidNamesById}
            wellContents={wellContents}
            nozzleType={null}
          />
        </div>
      )}

      <WellSelectionInstructions />
    </div>
  )
}
