// @flow
import * as React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'

import { Modal, OutlineButton, LabeledValue } from '@opentrons/components'
import { sortWells } from '@opentrons/shared-data'

import { changeFormInput } from '../../../../steplist/actions'
import WellSelectionInstructions from '../../../WellSelectionInstructions'
import { SelectableLabware, wellFillFromWellContents } from '../../../labware'

import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { selectors } from '../../../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as stepsSelectors } from '../../../../ui/steps'

import type { BaseState, ThunkDispatch } from '../../../../types'
import type { WellArray } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'
import type { ContentsByWell } from '../../../../labware-ingred/types'
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
  initialSelectedWells: WellArray,
  wellContents: ContentsByWell,
  labwareDef: ?LabwareDefinition2,
  ingredNames: WellIngredientNames,
|}

type DP = {| saveWellSelection: WellArray => mixed |}

type Props = {| ...OP, ...SP, ...DP |}
type State = { selectedWells: WellArray, highlightedWells: WellArray }

class WellSelectionModal extends React.Component<Props, State> {
  state = { selectedWells: [], highlightedWells: [] }
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedWells: props.initialSelectedWells,
      highlightedWells: [],
    }
  }

  updateHighlightedWells = (wells: WellArray) => {
    this.setState({ highlightedWells: wells })
  }

  selectWells = (wells: WellArray) => {
    this.setState({
      selectedWells: [...this.state.selectedWells, ...wells],
      highlightedWells: [],
    })
  }

  deselectWells = (wells: WellArray) => {
    this.setState({
      selectedWells: this.state.selectedWells.filter(w => !wells.includes(w)),
      highlightedWells: [],
    })
  }

  handleSave = () => {
    this.props.saveWellSelection(this.state.selectedWells)
    this.props.onCloseClick()
  }

  render() {
    if (!this.props.isOpen) return null
    const { labwareDef, pipetteSpec } = this.props

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
              wellFill: wellFillFromWellContents(this.props.wellContents),
            }}
            selectedPrimaryWells={this.state.selectedWells}
            selectWells={this.selectWells}
            deselectWells={this.deselectWells}
            updateHighlightedWells={this.updateHighlightedWells}
            pipetteChannels={pipetteSpec ? pipetteSpec.channels : null}
            ingredNames={this.props.ingredNames}
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
    initialSelectedWells: formData ? formData[ownProps.name] : [],
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
          update: { [ownProps.name]: wells.sort(sortWells) },
        })
      ),
  }
}

export default connect<Props, OP, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(WellSelectionModal)
