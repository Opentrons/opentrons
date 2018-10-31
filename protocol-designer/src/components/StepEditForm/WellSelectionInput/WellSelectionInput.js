// @flow
import * as React from 'react'
import {FormGroup, InputField} from '@opentrons/components'
import WellSelectionModal from './WellSelectionModal'
import {Portal} from '../../portals/MainPageModalPortal'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'
import { FocusHandlers } from '../index'

type Props = {
  name: StepFieldName,
  primaryWellCount?: number,
  disabled: boolean,
  errorToShow: ?string,
  isMulti: ?boolean,
  pipetteId: ?string,
  labwareId: ?string,
} & FocusHandlers

type State = {isModalOpen: boolean}

class WellSelectionInput extends React.Component<Props, State> {
  state = {isModalOpen: false}

  handleOpen = () => {
    this.props.onFieldFocus(this.props.name)
    this.setState({isModalOpen: true})
  }

  handleClose= () => {
    this.props.onFieldBlur(this.props.name)
    this.setState({isModalOpen: false})
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

export default WellSelectionInput
