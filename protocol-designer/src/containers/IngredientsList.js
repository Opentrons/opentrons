// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {selectors} from '../labware-ingred/reducers'
import * as wellSelectionSelectors from '../top-selectors/well-contents'
import {editModeIngredientGroup, deleteIngredient, openRenameLabwareForm} from '../labware-ingred/actions'
import type {BaseState, ThunkDispatch} from '../types'

import IngredientsList from '../components/IngredientsList'

type Props = React.ElementProps<typeof IngredientsList>

type DP = {
  editModeIngredientGroup: $ElementType<Props, 'editModeIngredientGroup'>,
  deleteIngredient: $ElementType<Props, 'deleteIngredient'>,
  openRenameLabwareForm: $ElementType<Props, 'openRenameLabwareForm'>,
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState): SP {
  const container = selectors.getSelectedContainer(state)

  return {
    renameLabwareFormMode: selectors.getRenameLabwareFormMode(state),
    ingredientGroups: selectors.getIngredientGroups(state),
    labwareWellContents: (container && selectors.getIngredientLocations(state)[container.id]) || {},
    selectedIngredientGroupId: wellSelectionSelectors.getSelectedWellsCommonIngredId(state),
    selected: false,
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {
    editModeIngredientGroup: (args) => dispatch(editModeIngredientGroup(args)),
    deleteIngredient: (args) => dispatch(deleteIngredient(args)),
    openRenameLabwareForm: () => dispatch(openRenameLabwareForm()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IngredientsList)
