// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {selectors} from '../labware-ingred/reducers'
import * as wellSelectionSelectors from '../top-selectors/well-contents'
import {removeWellsContents, openRenameLabwareForm} from '../labware-ingred/actions'
import type {Dispatch} from 'redux'
import type {BaseState} from '../types'

import IngredientsList from '../components/IngredientsList'

type Props = React.ElementProps<typeof IngredientsList>

type DP = {
  removeWellsContents: $ElementType<Props, 'removeWellsContents'>,
  openRenameLabwareForm: $ElementType<Props, 'openRenameLabwareForm'>,
}

type SP = $Diff<Props, DP> & {_labwareId: ?string}

function mapStateToProps (state: BaseState): SP {
  const container = selectors.getSelectedContainer(state)
  const _labwareId = container && container.id

  return {
    renameLabwareFormMode: selectors.getRenameLabwareFormMode(state),
    liquidGroupsById: selectors.getLiquidGroupsById(state),
    labwareWellContents: (container && selectors.getIngredientLocations(state)[container.id]) || {},
    selectedIngredientGroupId: wellSelectionSelectors.getSelectedWellsCommonIngredId(state),
    selected: false,
    _labwareId,
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {dispatch} = dispatchProps
  const {_labwareId, ...passThruProps} = stateProps
  return {
    ...passThruProps,
    removeWellsContents: (args) => dispatch(removeWellsContents({...args, labwareId: _labwareId})),
    openRenameLabwareForm: () => dispatch(openRenameLabwareForm()),
  }
}

export default connect(mapStateToProps, null, mergeProps)(IngredientsList)
