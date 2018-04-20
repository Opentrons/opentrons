// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { editIngredient, editModeIngredientGroup, deleteIngredient } from '../labware-ingred/actions'
import { selectors } from '../labware-ingred/reducers'
import {selectedWellsMaxVolume} from '../top-selectors/well-contents'
import wellSelectionSelectors from '../well-selection/selectors'
import IngredientPropertiesForm from '../components/IngredientPropertiesForm.js'
import type {BaseState} from '../types'

type Props = React.ElementProps<typeof IngredientPropertiesForm>

type DispatchProps = {
  onSave: *,
  onCancel: *,
  onDelete: *
}

type StateProps = $Diff<Props, DispatchProps>

function mapStateToProps (state: BaseState): StateProps {
  const selectedIngredGroup = selectors.selectedIngredientGroup(state)
  return {
    editingIngredGroupId: selectedIngredGroup && selectedIngredGroup.groupId,
    numWellsSelected: wellSelectionSelectors.numWellsSelected(state),
    selectedWellsMaxVolume: selectedWellsMaxVolume(state),
    allIngredientNamesIds: selectors.allIngredientNamesIds(state),
    allIngredientGroupFields: selectors.allIngredientGroupFields(state)
  }
}

// TODO Ian 2018-03-08 also type mapDispatchToProps

export default connect(
  mapStateToProps,
  {
    onSave: editIngredient,
    onCancel: () => editModeIngredientGroup(null), // call with no args
    onDelete: (groupId: string) => deleteIngredient({groupId})
  }
)(IngredientPropertiesForm)
