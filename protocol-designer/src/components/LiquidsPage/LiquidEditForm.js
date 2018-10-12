// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import assert from 'assert'

import * as labwareIngredActions from '../../labware-ingred/actions'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {IngredInputs} from '../../labware-ingred/types'
import type {BaseState, ThunkDispatch} from '../../types'

import {
  Card,
  CheckboxField,
  FormGroup,
  InputField,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'
import styles from './LiquidEditForm.css'
import formStyles from '../forms.css'

type Props = {
  ...IngredInputs,
  deleteLiquidGroup: () => mixed,
  cancelForm: () => mixed,
  saveForm: (IngredInputs) => mixed,
}
type State = IngredInputs

type WrapperProps = {showForm: boolean, formKey: string, formProps: Props}

type SP = {
  ...IngredInputs,
  _liquidGroupId: ?string,
  showForm: boolean,
}

// TODO IMMEDIATELY: internationalization of copy
class LiquidEditForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      name: props.name,
      description: props.description,
      serialize: props.serialize || false,
    }
  }

  updateForm = (fieldName: $Keys<IngredInputs>) => (e: SyntheticInputEvent<*>) => {
    // TODO how to handle checkbox cleanly???
    if (fieldName === 'serialize') {
      this.setState({[fieldName]: !this.state[fieldName]})
    } else {
      this.setState({[fieldName]: e.currentTarget.value})
    }
  }

  handleSaveForm = (e: SyntheticMouseEvent<*>) => {
    this.props.saveForm(this.state)
  }

  render () {
    const {deleteLiquidGroup, cancelForm} = this.props
    const {name, description, serialize} = this.state
    return (
      <Card className={styles.form_card}>
        <section className={styles.section}>
          <div className={formStyles.header}>Details</div>
          <div className={formStyles.row_wrapper}>
            <FormGroup label='Liquid name:' className={formStyles.column_1_2}>
              <InputField value={name} onChange={this.updateForm('name')} />
            </FormGroup>
            <FormGroup label='Description:' className={formStyles.column_1_2}>
              <InputField value={description} onChange={this.updateForm('description')} />
            </FormGroup>
          </div>
        </section>

        <section className={styles.section}>
          <div className={formStyles.header}>Serialization</div>
          <p className={styles.info_text}>{'Each placement of the liquid will get its own number. ("Sample 1", "Sample 2", "Sample 3")'}</p>
          <CheckboxField label='Serialize' value={serialize} onChange={this.updateForm('serialize')} />
        </section>

        <div className={styles.button_row}>
          <OutlineButton onClick={deleteLiquidGroup}>DELETE</OutlineButton>
          <PrimaryButton onClick={cancelForm}>CANCEL</PrimaryButton>
          <PrimaryButton onClick={this.handleSaveForm}>SAVE</PrimaryButton>
        </div>
      </Card>
    )
  }
}

function LiquidEditFormWrapper (props: WrapperProps) {
  const {showForm, formKey, formProps} = props
  return showForm
    ? <LiquidEditForm {...formProps} key={formKey} />
    : null
}

function mapStateToProps (state: BaseState): SP {
  const selectedLiquidGroupState = labwareIngredSelectors.getSelectedLiquidGroupState(state)
  const _liquidGroupId = (selectedLiquidGroupState && selectedLiquidGroupState.liquidGroupId)
  const allIngredientGroupFields = labwareIngredSelectors.allIngredientGroupFields(state)
  const selectedIngredFields = _liquidGroupId ? allIngredientGroupFields[_liquidGroupId] : {}
  const showForm = Boolean(selectedLiquidGroupState.liquidGroupId || selectedLiquidGroupState.newLiquidGroup)
  assert(!(_liquidGroupId && !selectedIngredFields), `Expected selected liquid group "${String(_liquidGroupId)}" to have fields in allIngredientGroupFields`)

  return {
    _liquidGroupId,
    showForm,
    name: selectedIngredFields.name,
    description: selectedIngredFields.description,
    serialize: selectedIngredFields.serialize,
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: ThunkDispatch<*>}): WrapperProps {
  const {dispatch} = dispatchProps
  const {showForm, _liquidGroupId, ...passThruFormProps} = stateProps
  return {
    showForm,
    formKey: _liquidGroupId || '__new_form__',
    formProps: {
      ...passThruFormProps,
      deleteLiquidGroup: () => window.alert('Deleting liquids is not yet implemented'), // TODO: Ian 2018-10-12 later ticket
      cancelForm: () => dispatch(labwareIngredActions.deselectLiquidGroup()),
      saveForm: (formData: IngredInputs) => dispatch(labwareIngredActions.editLiquidGroup({
        ...formData,
        liquidGroupId: _liquidGroupId,
      })),
    },
  }
}

export default connect(mapStateToProps, null, mergeProps)(LiquidEditFormWrapper)
