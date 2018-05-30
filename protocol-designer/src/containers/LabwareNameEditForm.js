// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import type {BaseState} from '../types'

import {FormGroup, InputField, PrimaryButton} from '@opentrons/components'
import formStyles from '../components/Form.css'

type Props = {
  labwareName: string,
  onCancel: (event: SyntheticMouseEvent<*>) => mixed,
  onSaveName: (name: string) => (event: SyntheticMouseEvent<*>) => mixed
}

type SP = {
  labwareName: $ElementType<Props, 'labwareName'>
}

type DP = $Diff<Props, SP>

type State = {
  name: string
}

class LabwareNameEditForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {name: props.labwareName}
  }

  handleChangeName = (e: SyntheticInputEvent<*>) => {
    this.setState({name: e.currentTarget.value})
  }

  render () {
    const {onCancel, onSaveName} = this.props

    return (
      <div className={formStyles.form}>
        <div className={formStyles.field_row}>
          <FormGroup label='Labware Name'>
            <InputField value={this.state.name} onChange={this.handleChangeName} />
          </FormGroup>
        </div>

        <div className={formStyles.simple_button_row}>
          <PrimaryButton onClick={onCancel}>Close</PrimaryButton>
          <PrimaryButton onClick={onSaveName && onSaveName(this.state.name)}>Save</PrimaryButton>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state: BaseState): SP {
  return {
    labwareName: 'todo name here'
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onCancel: () => console.log('cancel'),
    onSaveName: (name) => () => console.log(name)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LabwareNameEditForm)
