// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FormGroup, InputField} from '@opentrons/components'
import WellSelectionModal from './WellSelectionModal'
import {Portal} from '../../portals/MainPageModalPortal'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import {selectors as steplistSelectors, actions as steplistActions} from '../../../steplist'
import styles from '../StepEditForm.css'
import type { FocusHandlers } from '../index'

type SP = {
  wellSelectionLabwareId: ?string,
}
type DP = {
  onOpen: (string) => mixed,
  onClose: () => mixed,
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

type Props = OP & SP & DP

class WellSelectionInput extends React.Component<Props> {
  handleOpen = () => {
    this.props.onFieldFocus(this.props.name)
    this.props.onOpen(this.props.labwareId)
  }

  handleClose= () => {
    this.props.onFieldBlur(this.props.name)
    this.props.onClose()
  }

  render () {
    const modalKey = `${this.props.name}${this.props.pipetteId || 'noPipette'}${this.props.labwareId || 'noLabware'}${this.props.wellSelectionLabwareId}`
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
            isOpen={this.props.wellSelectionLabwareId === this.props.labwareId}
            onCloseClick={this.handleClose}
            name={this.props.name} />
        </Portal>
      </FormGroup>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  wellSelectionLabwareId: steplistSelectors.getWellSelectionLabwareId(state),
})
const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  onOpen: id => dispatch(steplistActions.setWellSelectionLabwareId(id)),
  onClose: () => dispatch(steplistActions.clearWellSelectionLabwareId()),
})

export default connect(mapStateToProps, mapDispatchToProps)(WellSelectionInput)
