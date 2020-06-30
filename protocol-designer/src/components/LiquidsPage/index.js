// @flow
import assert from 'assert'
import { connect } from 'react-redux'
import * as React from 'react'

import * as labwareIngredActions from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'

import type { LiquidGroup } from '../../labware-ingred/types'
import type { BaseState, ThunkDispatch } from '../../types'
import { LiquidsPageInfo } from './LiquidsPageInfo'
import { LiquidEditForm } from './LiquidEditForm'

type Props = React.ElementProps<typeof LiquidEditForm>
type WrapperProps = { showForm: boolean, formKey: string, formProps: Props }

type SP = {|
  ...$Exact<LiquidGroup>,
  _liquidGroupId: ?string,
  showForm: boolean,
  canDelete: $ElementType<Props, 'canDelete'>,
|}

function LiquidEditFormWrapper(props: WrapperProps) {
  const { showForm, formKey, formProps } = props
  return showForm ? (
    <LiquidEditForm {...formProps} key={formKey} />
  ) : (
    <LiquidsPageInfo />
  )
}

function mapStateToProps(state: BaseState): SP {
  const selectedLiquidGroupState = labwareIngredSelectors.getSelectedLiquidGroupState(
    state
  )
  const _liquidGroupId =
    selectedLiquidGroupState && selectedLiquidGroupState.liquidGroupId
  const allIngredientGroupFields = labwareIngredSelectors.allIngredientGroupFields(
    state
  )
  const selectedIngredFields = _liquidGroupId
    ? allIngredientGroupFields[_liquidGroupId]
    : {}
  const showForm = Boolean(
    selectedLiquidGroupState.liquidGroupId ||
      selectedLiquidGroupState.newLiquidGroup
  )
  assert(
    !(_liquidGroupId && !selectedIngredFields),
    `Expected selected liquid group "${String(
      _liquidGroupId
    )}" to have fields in allIngredientGroupFields`
  )

  return {
    _liquidGroupId,
    canDelete: _liquidGroupId != null,
    showForm,
    name: selectedIngredFields.name,
    description: selectedIngredFields.description,
    serialize: selectedIngredFields.serialize,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> }
): WrapperProps {
  const { dispatch } = dispatchProps
  const { showForm, _liquidGroupId, ...passThruFormProps } = stateProps

  return {
    showForm,
    formKey: _liquidGroupId || '__new_form__',
    formProps: {
      ...passThruFormProps,
      deleteLiquidGroup: () =>
        _liquidGroupId &&
        dispatch(labwareIngredActions.deleteLiquidGroup(_liquidGroupId)),
      cancelForm: () => dispatch(labwareIngredActions.deselectLiquidGroup()),
      saveForm: (formData: LiquidGroup) =>
        dispatch(
          labwareIngredActions.editLiquidGroup({
            ...formData,
            liquidGroupId: _liquidGroupId,
          })
        ),
    },
  }
}

export const LiquidsPage: React.AbstractComponent<{||}> = connect<
  WrapperProps,
  {||},
  SP,
  {||},
  _,
  _
>(
  mapStateToProps,
  null,
  mergeProps
)(LiquidEditFormWrapper)
