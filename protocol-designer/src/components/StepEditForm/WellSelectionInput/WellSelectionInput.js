// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FormGroup, InputField} from '@opentrons/components'
import WellSelectionModal from './WellSelectionModal'
import {Portal} from '../../portals/MainPageModalPortal'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import {selectors as labwareIngredSelectors} from '../../../labware-ingred/reducers'
import * as wellSelectionActions from '../../../well-selection/actions'
import styles from '../StepEditForm.css'
import type { FocusHandlers } from '../index'

type SP = {_labwareNames: {[labwareId: string]: string}}
type DP = {
  _setWellSelectionLabwareName: (string) => mixed,
  _clearWellSelectionLabwareName: () => mixed,
}

type OP = {
  name: StepFieldName,
  primaryWellCount?: number,
  disabled: boolean,
  errorToShow: ?string,
  isMulti: ?boolean,
  pipetteId: ?string,
  labwareId: ?string,
  onFieldBlur: $PropertyType<FocusHandlers, 'onFieldBlur'>,
  onFieldFocus: $PropertyType<FocusHandlers, 'onFieldFocus'>,
}

type Props = OP & {onOpen: () => void, onClose: () => void}

type State = {isModalOpen: boolean}

class WellSelectionInput extends React.Component<Props, State> {
  state = {isModalOpen: false}

  handleOpen = () => {
    this.props.onFieldFocus(this.props.name)
    this.setState({isModalOpen: true})
    this.props.onOpen()
  }

  handleClose= () => {
    this.props.onFieldBlur(this.props.name)
    this.setState({isModalOpen: false})
    this.props.onClose()
  }

  render () {
    const modalKey = `${this.props.name}${this.props.pipetteId || 'noPipette'}${this.props.labwareId || 'noLabware'}${String(this.state.isModalOpen)}`
    return (
      <FormGroup
        label={this.props.isMulti ? 'Columns:' : 'Wells:'}
        disabled={this.props.disabled}
        className={styles.well_selection_input}>
        <InputField
          readOnly
          name={this.props.name}
          value={this.props.primaryWellCount ? String(this.props.primaryWellCount) : null}
          onClick={this.handleOpen}
          error={this.props.errorToShow} />
        <Portal>
          <WellSelectionModal
            key={modalKey}
            pipetteId={this.props.pipetteId}
            labwareId={this.props.labwareId}
            isOpen={this.state.isModalOpen}
            onCloseClick={this.handleClose}
            name={this.props.name} />
        </Portal>
      </FormGroup>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  _labwareNames: labwareIngredSelectors.getLabwareNames(state),
})
const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  _setWellSelectionLabwareName: name => dispatch(wellSelectionActions.setWellSelectionLabwareName(name)),
  _clearWellSelectionLabwareName: () => dispatch(wellSelectionActions.clearWellSelectionLabwareName()),
})
const mergeProps = (stateProps: SP, dispatchProps: DP, ownProps: OP): Props => ({
  ...ownProps,
  onOpen: () => {
    dispatchProps._setWellSelectionLabwareName(stateProps._labwareNames[ownProps.labwareId])
  },
  onClose: dispatchProps._clearWellSelectionLabwareName,
})

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(WellSelectionInput)
