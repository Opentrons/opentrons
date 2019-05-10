// @flow
import * as React from 'react'
import cx from 'classnames'
import reduce from 'lodash/reduce'
import { connect } from 'react-redux'

import {
  Modal,
  OutlineButton,
  LabeledValue,
  ingredIdsToColor,
} from '@opentrons/components'
import { sortWells } from '@opentrons/shared-data'

import { changeFormInput } from '../../../../steplist/actions'
import WellSelectionInstructions from '../../../WellSelectionInstructions'
import { SelectableLabware } from '../../../labware'

import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { selectors } from '../../../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as stepsSelectors } from '../../../../ui/steps'

import type { BaseState, ThunkDispatch } from '../../../../types'
import type {
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'
import type {
  WellSet,
  ContentsByWell,
  WellContents,
} from '../../../../labware-ingred/types'
import type { WellIngredientNames } from '../../../../steplist/types'
import type { StepFieldName } from '../../../../form-types'

import styles from './WellSelectionModal.css'
import modalStyles from '../../../modals/modal.css'

type OP = {|
  pipetteId: ?string,
  labwareId: ?string,
  isOpen: boolean,
  onCloseClick: (e: ?SyntheticEvent<*>) => mixed,
  name: StepFieldName,
|}

type SP = {|
  pipetteSpec: ?PipetteNameSpecs,
  initialSelectedWells: WellSet,
  wellContents: ContentsByWell,
  labwareDef: ?LabwareDefinition2,
  ingredNames: WellIngredientNames,
|}

type DP = {| saveWellSelection: WellSet => mixed |}

type Props = {| ...OP, ...SP, ...DP |}
type State = { selectedWells: WellSet, highlightedWells: WellSet }

class WellSelectionModal extends React.Component<Props, State> {
  state = { selectedWells: new Set(), highlightedWells: new Set() }
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedWells: props.initialSelectedWells,
      highlightedWells: new Set(),
    }
  }

  updateHighlightedWells = (wells: WellSet) => {
    this.setState({ highlightedWells: wells })
  }

  selectWells = (wells: WellSet) => {
    this.setState({
      selectedWells: new Set([...this.state.selectedWells, ...wells]),
      highlightedWells: new Set(),
    })
  }

  deselectWells = (wells: WellSet) => {
    this.setState({
      selectedWells: new Set(
        [...this.state.selectedWells].filter(w => !wells.has(w))
      ),
      highlightedWells: new Set(),
    })
  }

  handleSave = () => {
    this.props.saveWellSelection(this.state.selectedWells)
    this.props.onCloseClick()
  }

  render() {
    if (!this.props.isOpen) return null
    const { labwareDef, pipetteSpec } = this.props

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
      <Modal
        className={modalStyles.modal}
        contentsClassName={cx(
          modalStyles.modal_contents,
          modalStyles.transparent_content
        )}
        onCloseClick={this.props.onCloseClick}
      >
        <div className={styles.top_row}>
          <LabeledValue
            label="Pipette"
            value={pipetteSpec ? pipetteSpec.displayName : ''}
            className={styles.inverted_text}
          />
          <OutlineButton onClick={this.handleSave} inverted>
            SAVE SELECTION
          </OutlineButton>
        </div>

        {labwareDef && (
          <SelectableLabware
            labwareProps={{
              showLabels: true,
              definition: labwareDef,
              highlightedWells: this.state.highlightedWells,
              selectedWells: this.state.selectedWells,
              wellFill,
            }}
            selectWells={this.selectWells}
            deselectWells={this.deselectWells}
            updateHighlightedWells={this.updateHighlightedWells}
            pipetteChannels={pipetteSpec ? pipetteSpec.channels : null}
            ingredNames={this.props.ingredNames}
            // TODO IMMEDIATELY: wellContents to wellFill
            wellContents={this.props.wellContents}
          />
        )}

        <WellSelectionInstructions />
      </Modal>
    )
  }
}

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const { pipetteId, labwareId } = ownProps

  const labwareDef =
    (labwareId &&
      stepFormSelectors.getLabwareEntities(state)[labwareId]?.def) ||
    null
  const allWellContentsForSteps = wellContentsSelectors.getAllWellContentsForSteps(
    state
  )

  const stepId = stepsSelectors.getSelectedStepId(state)
  const orderedStepIds = stepFormSelectors.getOrderedStepIds(state)
  const timelineIdx = orderedStepIds.findIndex(id => id === stepId)
  const allWellContentsForStep = allWellContentsForSteps[timelineIdx]
  const formData = stepFormSelectors.getUnsavedForm(state)
  const ingredNames = selectors.getLiquidNamesById(state)

  const pipette =
    pipetteId != null
      ? stepFormSelectors.getPipetteEntities(state)[pipetteId]
      : null

  return {
    initialSelectedWells: formData
      ? new Set(formData[ownProps.name])
      : new Set(),
    pipetteSpec: pipette && pipette.spec,
    wellContents:
      labwareId && allWellContentsForStep
        ? allWellContentsForStep[labwareId]
        : {},
    labwareDef,
    ingredNames,
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  return {
    saveWellSelection: wells =>
      dispatch(
        changeFormInput({
          update: { [ownProps.name]: [...wells].sort(sortWells) },
        })
      ),
  }
}

export default connect<Props, OP, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(WellSelectionModal)
