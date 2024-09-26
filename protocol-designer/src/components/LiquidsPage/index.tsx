import { useDispatch, useSelector } from 'react-redux'

import * as labwareIngredActions from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { LiquidEditForm } from './LiquidEditForm'
import { LiquidsPageInfo } from './LiquidsPageInfo'

import type { LiquidGroup } from '../../labware-ingred/types'
import type { ThunkDispatch } from '../../types'

export function LiquidsPage(): JSX.Element {
  const dispatch = useDispatch<ThunkDispatch<any>>()
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

  return showForm ? (
    <LiquidEditForm
      cancelForm={cancelForm}
      deleteLiquidGroup={deleteLiquidGroup}
      saveForm={saveForm}
      canDelete={liquidGroupId != null}
      name={selectedIngredFields?.name ?? ''}
      serialize={selectedIngredFields?.serialize ?? false}
      displayColor={selectedIngredFields?.displayColor}
      description={selectedIngredFields?.description ?? ''}
      key={formKey}
    />
  ) : (
    <LiquidsPageInfo />
  )
}
