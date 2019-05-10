// @flow
import assert from 'assert'
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'

import { ingredIdsToColor } from '@opentrons/components'
import { SelectableLabware } from '../components/labware'
import LiquidPlacementForm from '../components/LiquidPlacementForm'
import WellSelectionInstructions from './WellSelectionInstructions'

import { selectors } from '../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../step-forms'
import * as wellContentsSelectors from '../top-selectors/well-contents'
import wellSelectionSelectors from '../well-selection/selectors'
import { selectWells, deselectWells } from '../well-selection/actions'

import styles from './LiquidPlacementModal.css'

import type { Dispatch } from 'redux'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BaseState } from '../types'
import type {
  Wells,
  WellSet,
  WellContents,
  ContentsByWell,
} from '../labware-ingred/types'
import type { WellIngredientNames } from '../steplist'

type SP = {|
  selectedWells: Wells,
  wellContents: ContentsByWell,
  labwareDef: ?LabwareDefinition2,
  liquidNamesById: WellIngredientNames,
|}

type DP = {|
  selectWells: WellSet => mixed,
  deselectWells: WellSet => mixed,
|}

type Props = { ...SP, ...DP }

type State = { highlightedWells: WellSet }

class LiquidPlacementModal extends React.Component<Props, State> {
  state = { highlightedWells: new Set() }
  constructor(props: Props) {
    super(props)
    this.state = { highlightedWells: new Set() }
  }

  updateHighlightedWells = (wells: WellSet) => {
    this.setState({ highlightedWells: wells })
  }

  render() {
    const { labwareDef, selectedWells } = this.props

    const wellFill = reduce(
      // TODO IMMEDIATELY
      this.props.wellContents,
      (acc, wellContents: WellContents, wellName) => ({
        ...acc,
        [wellName]: ingredIdsToColor(wellContents.groupIds),
      }),
      {}
    )

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
                showLabels: true,
                definition: labwareDef,
                // TODO IMMEDIATELY
                highlightedWells: this.state.highlightedWells,
                selectedWells: new Set(Object.keys(selectedWells)), // TODO IMMEDIATELY
                wellFill,
              }}
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
  const selectedWells = wellSelectionSelectors.getSelectedWells(state)
  if (labwareId == null) {
    assert(
      false,
      'LiquidPlacementModal: No labware is selected, and no labwareId was given to LiquidPlacementModal'
    )
    return {
      selectedWells: {},
      wellContents: {},
      labwareDef: null,
      liquidNamesById: {},
    }
  }

  const labwareDef = stepFormSelectors.getLabwareEntities(state)[labwareId]?.def
  let wellContents: ContentsByWell = {}

  // selection for deck setup: shows initial state of liquids
  wellContents = wellContentsSelectors.getWellContentsAllLabware(state)[
    labwareId
  ]

  return {
    selectedWells,
    wellContents,
    labwareDef,
    liquidNamesById: selectors.getLiquidNamesById(state),
  }
}

// TODO IMMEDIATELY remove this, it's just back-compat for Wells {A1: 'A1'} type
const wellSetToDeprecatedWells = (wellSet: WellSet): Wells =>
  [...wellSet].reduce((acc, wellName) => ({ ...acc, [wellName]: wellName }), {})

const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  deselectWells: wells =>
    dispatch(deselectWells(wellSetToDeprecatedWells(wells))),
  selectWells: wells => dispatch(selectWells(wellSetToDeprecatedWells(wells))),
})

export default connect<Props, {||}, _, _, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(LiquidPlacementModal)
