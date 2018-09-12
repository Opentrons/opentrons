// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {
  editIngredient,
  editModeIngredientGroup,
  deleteIngredient,
  type EditIngredientPayload,
} from '../labware-ingred/actions'
import {selectors} from '../labware-ingred/reducers'
import * as wellContentsSelectors from '../top-selectors/well-contents'
import wellSelectionSelectors from '../well-selection/selectors'
import IngredientPropertiesForm from '../components/IngredientPropertiesForm.js'
import type {BaseState, ThunkDispatch} from '../types'

type Props = React.ElementProps<typeof IngredientPropertiesForm>

type DP = {
  onSave: $PropertyType<Props, 'onSave'>,
  onCancel: $PropertyType<Props, 'onCancel'>,
  onDelete: $PropertyType<Props, 'onDelete'>,
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState): SP {
  return {
    commonSelectedIngred: wellContentsSelectors.getSelectedWellsCommonIngredId(state),
    commonSelectedVolume: wellContentsSelectors.getSelectedWellsCommonVolume(state),
    selectedWells: Object.keys(wellSelectionSelectors.getSelectedWells(state)),
    selectedWellsMaxVolume: wellContentsSelectors.selectedWellsMaxVolume(state),
    allIngredientNamesIds: selectors.allIngredientNamesIds(state),
    allIngredientGroupFields: selectors.allIngredientGroupFields(state),
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {
    onSave: (payload: EditIngredientPayload) => dispatch(editIngredient(payload)),
    onCancel: () => dispatch(editModeIngredientGroup(null)),
    onDelete: (groupId: string) => dispatch(deleteIngredient({groupId})),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IngredientPropertiesForm)
