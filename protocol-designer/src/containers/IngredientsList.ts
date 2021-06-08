import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import * as wellSelectionSelectors from '../top-selectors/well-contents'
import {
  removeWellsContents,
  RemoveWellsContentsAction,
} from '../labware-ingred/actions'
import { Dispatch } from 'redux'
import { BaseState } from '../types'
import {
  IngredientsList as IngredientsListComponent,
  RemoveWellsContents,
} from '../components/IngredientsList'
type Props = React.ComponentProps<typeof IngredientsListComponent>
type SP = Omit<
  Props,
  {
    removeWellsContents: RemoveWellsContents
  }
> & {
  _labwareId: string | null | undefined
}

const mapStateToProps: MapStateToProps<SP, {}, BaseState> = state => {
  const selectedLabwareId = labwareIngredSelectors.getSelectedLabwareId(state)
  const labwareWellContents =
    (selectedLabwareId &&
      labwareIngredSelectors.getLiquidsByLabwareId(state)[selectedLabwareId]) ||
    {}
  return {
    liquidGroupsById: labwareIngredSelectors.getLiquidGroupsById(state),
    labwareWellContents,
    selectedIngredientGroupId: wellSelectionSelectors.getSelectedWellsCommonIngredId(
      state
    ),
    selected: false,
    _labwareId: selectedLabwareId,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: Dispatch<any>
  }
): Props {
  const { dispatch } = dispatchProps
  const { _labwareId, ...passThruProps } = stateProps
  return {
    ...passThruProps,
    removeWellsContents: args => {
      if (_labwareId) {
        dispatch(removeWellsContents({ ...args, labwareId: _labwareId }))
      }
    },
  }
}

// ce: fix
export const IngredientsList = connect(
  mapStateToProps,
  null,
  mergeProps
)(IngredientsListComponent)
