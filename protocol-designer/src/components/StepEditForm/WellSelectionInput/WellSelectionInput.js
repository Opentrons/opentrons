// @flow
import * as React from 'react'
import {FormGroup, InputField} from '@opentrons/components'
import WellSelectionModal from './WellSelectionModal'
import {Portal} from '../../portals/MainPageModalPortal'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'

type Props = {
  name: StepFieldName,
  primaryWellCount?: number,
  disabled: boolean,
  onClick?: (e: SyntheticMouseEvent<*>) => mixed,
  errorToShow: ?string,
  isMulti: ?boolean,
  pipetteId: ?string,
  labwareId: ?string,
}

type State = {isModalOpen: boolean}

class WellSelectionInput extends React.Component<Props, State> {
  state = {isModalOpen: false}

  toggleModal = () => {
    this.setState({isModalOpen: !this.state.isModalOpen})
  }

  render () {
    return (
      <FormGroup
        label={this.props.isMulti ? 'Columns:' : 'Wells:'}
        disabled={this.props.disabled}
        className={styles.well_selection_input}>
        <InputField
          readOnly
          name={this.props.name}
          value={this.props.primaryWellCount ? String(this.props.primaryWellCount) : null}
          onClick={this.toggleModal}
          error={this.props.errorToShow} />
        <Portal>
          <WellSelectionModal
            key={`${this.props.name}${this.props.pipetteId || 'noPipette'}${this.props.labwareId || 'noLabware'}${String(this.state.isModalOpen)}`}
            pipetteId={this.props.pipetteId}
            labwareId={this.props.labwareId}
            isOpen={this.state.isModalOpen}
            onCloseClick={this.toggleModal}
            name={this.props.name} />
        </Portal>
      </FormGroup>
    )
  }
}

export default WellSelectionInput
