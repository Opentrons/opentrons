// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import assert from 'assert'

import LiquidEditForm from './LiquidEditForm'
import LiquidsPageInfo from './LiquidsPageInfo'
import * as labwareIngredActions from '../../labware-ingred/actions'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'

import type {LiquidGroup} from '../../labware-ingred/types'
import type {BaseState, ThunkDispatch} from '../../types'

type Props = React.ElementProps<typeof LiquidEditForm>
type WrapperProps = {showForm: boolean, formKey: string, formProps: Props}

type SP = {
  ...LiquidGroup,
  _liquidGroupId: ?string,
  showForm: boolean,
}

function LiquidEditFormWrapper (props: WrapperProps) {
  const {showForm, formKey, formProps} = props
  return showForm
    ? <LiquidEditForm {...formProps} key={formKey} />
    : <LiquidsPageInfo />
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
      saveForm: (formData: LiquidGroup) => dispatch(labwareIngredActions.editLiquidGroup({
        ...formData,
        liquidGroupId: _liquidGroupId,
      })),
    },
  }
}

export default connect(mapStateToProps, null, mergeProps)(LiquidEditFormWrapper)
