// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FormGroup, InputField} from '@opentrons/components'
import WellSelectionModal from './WellSelectionModal'
import {Portal} from '../../portals/MainPageModalPortal'
import {selectors as steplistSelectors, actions as steplistActions} from '../../../steplist'
import styles from '../StepEditForm.css'

import type {Dispatch} from 'redux'
import type {StepIdType, StepFieldName} from '../../../form-types'
import type {BaseState} from '../../../types'
import type { FocusHandlers } from '../index'

type SP = {
  stepId: ?StepIdType,
  wellSelectionLabwareKey: ?string,
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
    const {labwareId, pipetteId, name} = this.props
    this.props.onFieldFocus(name)
    if (labwareId && pipetteId) {
      this.props.onOpen(this.getModalKey())
    }
  }

  handleClose= () => {
    this.props.onFieldBlur(this.props.name)
    this.props.onClose()
  }

  getModalKey = () => {
    const {name, pipetteId, labwareId, stepId} = this.props
    return `${String(stepId)}${name}${pipetteId || 'noPipette'}${labwareId || 'noLabware'}`
  }
  render () {
    const modalKey = this.getModalKey()
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
            isOpen={this.props.wellSelectionLabwareKey === modalKey}
            onCloseClick={this.handleClose}
            name={this.props.name} />
        </Portal>
      </FormGroup>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  stepId: steplistSelectors.getSelectedStepId(state),
  wellSelectionLabwareKey: steplistSelectors.getWellSelectionLabwareKey(state),
})
const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  onOpen: key => dispatch(steplistActions.setWellSelectionLabwareKey(key)),
  onClose: () => dispatch(steplistActions.clearWellSelectionLabwareKey()),
})

export default connect(mapStateToProps, mapDispatchToProps)(WellSelectionInput)
