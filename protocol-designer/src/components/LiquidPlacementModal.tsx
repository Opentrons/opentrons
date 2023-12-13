import assert from 'assert'
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import isEmpty from 'lodash/isEmpty'
import { WellGroup, WELL_LABEL_OPTIONS } from '@opentrons/components'
import {
  wellFillFromWellContents,
  SelectableLabware,
} from '../components/labware'
import { LiquidPlacementForm } from '../components/LiquidPlacementForm'
import { WellSelectionInstructions } from './WellSelectionInstructions'

import { selectors } from '../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../step-forms'
import * as wellContentsSelectors from '../top-selectors/well-contents'
import { getSelectedWells } from '../well-selection/selectors'
import { selectWells, deselectWells } from '../well-selection/actions'

import styles from './LiquidPlacementModal.module.css'

import { Dispatch } from 'redux'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import { BaseState } from '../types'
import { ContentsByWell } from '../labware-ingred/types'
import { WellIngredientNames } from '../steplist'

interface SP {
  selectedWells: WellGroup
  wellContents: ContentsByWell
  labwareDef?: LabwareDefinition2 | null
  liquidNamesById: WellIngredientNames
  liquidDisplayColors: string[]
}

interface DP {
  selectWells: (wellGroup: WellGroup) => unknown
  deselectWells: (wellGroup: WellGroup) => unknown
}

type Props = SP & DP

interface State {
  highlightedWells: WellGroup
}

class LiquidPlacementModalComponent extends React.Component<Props, State> {
  state = { highlightedWells: {} }
  constructor(props: Props) {
    super(props)
    this.state = { highlightedWells: {} }
  }

  updateHighlightedWells = (wells: WellGroup): void => {
    this.setState({ highlightedWells: wells })
  }

  render(): JSX.Element {
    const { labwareDef, selectedWells, liquidDisplayColors } = this.props

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
                highlightedWells: this.state.highlightedWells,
                wellFill: wellFillFromWellContents(
                  this.props.wellContents,
                  liquidDisplayColors
                ),
              }}
              selectedPrimaryWells={selectedWells}
              selectWells={this.props.selectWells}
              deselectWells={this.props.deselectWells}
              updateHighlightedWells={this.updateHighlightedWells}
              ingredNames={this.props.liquidNamesById}
              wellContents={this.props.wellContents}
            />
          </div>
        )}

        <WellSelectionInstructions />
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => {
  const labwareId = selectors.getSelectedLabwareId(state)
  const selectedWells = getSelectedWells(state)
  if (labwareId == null) {
    assert(
      false,
      'LiquidPlacementModal: No labware is selected, and no labwareId was given to LiquidPlacementModal'
    )
    return {
      selectedWells: {},
      wellContents: null,
      labwareDef: null,
      liquidNamesById: {},
      liquidDisplayColors: [],
    }
  }

  const labwareDef = stepFormSelectors.getLabwareEntities(state)[labwareId]?.def
  let wellContents: ContentsByWell = null

  // selection for deck setup: shows initial state of liquids
  wellContents = wellContentsSelectors.getWellContentsAllLabware(state)[
    labwareId
  ]

  return {
    selectedWells,
    wellContents,
    labwareDef,
    liquidNamesById: selectors.getLiquidNamesById(state),
    liquidDisplayColors: selectors.getLiquidDisplayColors(state),
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  deselectWells: wells => dispatch(deselectWells(wells)),
  selectWells: wells => dispatch(selectWells(wells)),
})

export const LiquidPlacementModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(LiquidPlacementModalComponent)
