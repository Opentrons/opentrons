import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import assert from 'assert'

import * as labwareIngredActions from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { LiquidEditForm } from './LiquidEditForm'
import { LiquidsPageInfo } from './LiquidsPageInfo'

import type { LiquidGroup } from '../../labware-ingred/types'
import type { ThunkDispatch } from '../../types'

export function LiquidsPage(): JSX.Element {
  const dispatch: ThunkDispatch<any> = useDispatch()
  const selectedLiquidGroupState = useSelector(
    labwareIngredSelectors.getSelectedLiquidGroupState
  )
  const allIngredientGroupFields = useSelector(
    labwareIngredSelectors.allIngredientGroupFields
  )

  const liquidGroupId =
    selectedLiquidGroupState && selectedLiquidGroupState.liquidGroupId
  const selectedIngredFields =
    liquidGroupId != null ? allIngredientGroupFields[liquidGroupId] : null
  const showForm = Boolean(
    selectedLiquidGroupState.liquidGroupId ||
      selectedLiquidGroupState.newLiquidGroup
  )
  const formKey = liquidGroupId || '__new_form__'

  const deleteLiquidGroup = (): void => {
    if (liquidGroupId != null)
      dispatch(labwareIngredActions.deleteLiquidGroup(liquidGroupId))
  }
  const cancelForm = (): void => {
    dispatch(labwareIngredActions.deselectLiquidGroup())
  }

  const saveForm = (formData: LiquidGroup): void => {
    dispatch(
      labwareIngredActions.editLiquidGroup({
        ...formData,
        liquidGroupId: liquidGroupId,
      })
    )
  }
  assert(
    !(liquidGroupId && !selectedIngredFields),
    `Expected selected liquid group "${String(
      liquidGroupId
    )}" to have fields in allIngredientGroupFields`
  )

  return showForm ? (
    <LiquidEditForm
      cancelForm={cancelForm}
      deleteLiquidGroup={deleteLiquidGroup}
      saveForm={saveForm}
      canDelete={liquidGroupId != null}
      name={selectedIngredFields?.name ?? ''}
      serialize={selectedIngredFields?.serialize ?? false}
      displayColor={selectedIngredFields?.displayColor ?? '#B925FF'}
      description={selectedIngredFields?.description ?? ''}
      key={formKey}
    />
  ) : (
    <LiquidsPageInfo />
  )
}
