// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import type {BaseState} from '../types'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {closeRenameLabwareForm, modifyContainer} from '../labware-ingred/actions'

import {FormGroup, InputField, PrimaryButton} from '@opentrons/components'
import formStyles from '../components/Form.css'

type Props = {
  renameLabwareFormMode: boolean,
  labwareName: ?string,

  onCancel: (event: SyntheticMouseEvent<*>) => mixed,
  onSaveName: (name: ?string) => (event: SyntheticMouseEvent<*>) => mixed,
}

type SP = {
  renameLabwareFormMode: $ElementType<Props, 'renameLabwareFormMode'>,
  labwareName: $ElementType<Props, 'labwareName'>,
}

type MP = {
  _selectedLabwareId: ?string,
}

type State = {
  name: ?string,
}

class LabwareNameEditForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {name: null}
  }

  handleChangeName = (e: SyntheticInputEvent<*>) => {
    this.setState({name: e.target.value})
  }

  // TODO(mc, 2018-07-24): use a different lifecycle hook
  componentWillReceiveProps (nextProps: Props) {
    this.setState({name: nextProps.labwareName})
  }

  render () {
    const {onCancel, onSaveName, renameLabwareFormMode} = this.props

    if (!renameLabwareFormMode) {
      // Not in "rename labware form mode", don't show form
      return null
    }

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

function mapStateToProps (state: BaseState): SP & MP {
  const _selectedLabwareId = labwareIngredSelectors.getSelectedContainerId(state)
  return {
    labwareName: _selectedLabwareId && labwareIngredSelectors.getLabwareNames(state)[_selectedLabwareId],
    renameLabwareFormMode: labwareIngredSelectors.getRenameLabwareFormMode(state),

    _selectedLabwareId,
  }
}

function mergeProps (stateProps: SP & MP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_selectedLabwareId, ...props} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...props,

    onCancel: () => dispatch(closeRenameLabwareForm()),

    onSaveName: (name) => () => {
      if (_selectedLabwareId) {
        dispatch(modifyContainer({
          containerId: _selectedLabwareId,
          modify: {name},
        }))

        dispatch(closeRenameLabwareForm())
      } else {
        // TODO Ian 2018-05-30 use assert
        console.warn('Tried to save labware name with no selected labware')
      }
    },
  }
}

export default connect(mapStateToProps, null, mergeProps)(LabwareNameEditForm)
