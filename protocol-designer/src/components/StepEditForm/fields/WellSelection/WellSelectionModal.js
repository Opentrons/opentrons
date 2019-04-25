// @flow
import * as React from 'react'
import cx from 'classnames'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'
import { connect } from 'react-redux'

import { Modal, OutlineButton, LabeledValue } from '@opentrons/components'
import { sortWells } from '@opentrons/shared-data'
import type { PipetteNameSpecs } from '@opentrons/shared-data'
import type { BaseState, ThunkDispatch } from '../../../../types'

import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { selectors } from '../../../../labware-ingred/selectors'
import type { Wells, ContentsByWell } from '../../../../labware-ingred/types'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as stepsSelectors } from '../../../../ui/steps'
import type { WellIngredientNames } from '../../../../steplist/types'
import { changeFormInput } from '../../../../steplist/actions'
import type { StepFieldName } from '../../../../form-types'

import { SelectableLabware } from '../../../labware'
import SingleLabwareWrapper from '../../../SingleLabware'
import WellSelectionInstructions from '../../../WellSelectionInstructions'

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
  initialSelectedWells: Array<string>,
  wellContents: ContentsByWell,
  containerType: string,
  ingredNames: WellIngredientNames,
|}

type DP = {| saveWellSelection: Wells => mixed |}

type Props = {| ...OP, ...SP, ...DP |}
type State = { selectedWells: Wells, highlightedWells: Wells }

class WellSelectionModal extends React.Component<Props, State> {
  state = { selectedWells: {}, highlightedWells: {} }
  constructor(props: Props) {
    super(props)
    const initialSelectedWells = reduce(
      this.props.initialSelectedWells,
      (acc, well) => ({ ...acc, [well]: well }),
      {}
    )
    this.state = { selectedWells: initialSelectedWells, highlightedWells: {} }
  }

  updateHighlightedWells = (wells: Wells) => {
    this.setState({ highlightedWells: wells })
  }

  selectWells = (wells: Wells) => {
    this.setState({
      selectedWells: { ...this.state.selectedWells, ...wells },
      highlightedWells: {},
    })
  }

  deselectWells = (wells: Wells) => {
    this.setState({
      selectedWells: omit(this.state.selectedWells, Object.keys(wells)),
      highlightedWells: {},
    })
  }

  handleSave = () => {
    this.props.saveWellSelection(this.state.selectedWells)
    this.props.onCloseClick()
  }

  render() {
    if (!this.props.isOpen) return null
    const { pipetteSpec } = this.props

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

        <SingleLabwareWrapper showLabels>
          <SelectableLabware
            highlightedWells={this.state.highlightedWells}
            selectedWells={this.state.selectedWells}
            selectWells={this.selectWells}
            deselectWells={this.deselectWells}
            updateHighlightedWells={this.updateHighlightedWells}
            wellContents={this.props.wellContents}
            containerType={this.props.containerType}
            pipetteChannels={pipetteSpec ? pipetteSpec.channels : null}
            ingredNames={this.props.ingredNames}
          />
        </SingleLabwareWrapper>

        <WellSelectionInstructions />
      </Modal>
    )
  }
}

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const { pipetteId, labwareId } = ownProps

  const labwareType = labwareId
    ? stepFormSelectors.getLabwareTypesById(state)[labwareId]
    : null
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
    containerType: labwareType || 'missing labware',
    ingredNames,
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  return {
    saveWellSelection: wells =>
      dispatch(
        changeFormInput({
          update: { [ownProps.name]: Object.keys(wells).sort(sortWells) },
        })
      ),
  }
}

export default connect<Props, OP, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(WellSelectionModal)
