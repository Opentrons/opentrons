import * as React from 'react'
import { connect } from 'react-redux'
import assert from 'assert'

import { LiquidEditForm } from './LiquidEditForm'
import { LiquidsPageInfo } from './LiquidsPageInfo'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'

import { LiquidGroup } from '../../labware-ingred/types'
import { BaseState, ThunkDispatch } from '../../types'

type Props = React.ComponentProps<typeof LiquidEditForm>
interface WrapperProps {
  showForm: boolean
  formKey: string
  formProps: Props
}

type SP = LiquidGroup & {
  _liquidGroupId?: string | null
  showForm: boolean
  canDelete: Props['canDelete']
}

function LiquidEditFormWrapper(props: WrapperProps): JSX.Element {
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
    // @ts-expect-error(sa, 2021-6-22): name might not exist
    name: selectedIngredFields.name,
    // @ts-expect-error(sa, 2021-6-22): description might not exist
    description: selectedIngredFields.description,
    // @ts-expect-error(sh, 2022-6-28): displayColor might not exist
    displayColor: selectedIngredFields.displayColor,
    // @ts-expect-error(sa, 2021-6-22): serialize might not exist
    serialize: selectedIngredFields.serialize,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<any> }
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

export const LiquidsPage = connect(
  mapStateToProps,
  null,
  mergeProps
)(LiquidEditFormWrapper)
