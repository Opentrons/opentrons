// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import assert from 'assert'
import {
  setWellContents,
} from '../../labware-ingred/actions'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import wellSelectionSelectors from '../../well-selection/selectors'
import {deselectAllWells} from '../../well-selection/actions'
import LiquidPlacementForm from './LiquidPlacementForm'
import type {Dispatch} from 'redux'
import type {ValidFormValues} from './LiquidPlacementForm'
import type {BaseState} from '../../types'

type Props = React.ElementProps<typeof LiquidPlacementForm>

type DP = {
  cancelForm: $PropertyType<Props, 'cancelForm'>,
  clearWells: $PropertyType<Props, 'clearWells'>,
  saveForm: $PropertyType<Props, 'saveForm'>,
}

type SP = $Diff<Props, DP> & {
  _labwareId: ?string,
  _selectedWells: ?Array<string>,
}

function mapStateToProps (state: BaseState): SP {
  const selectedWells = Object.keys(wellSelectionSelectors.getSelectedWells(state))

  return {
    commonSelectedLiquidId: wellContentsSelectors.getSelectedWellsCommonIngredId(state),
    commonSelectedVolume: wellContentsSelectors.getSelectedWellsCommonVolume(state),
    liquidSelectionOptions: labwareIngredSelectors.getLiquidSelectionOptions(state),
    showForm: selectedWells.length > 0,
    selectedWellsMaxVolume: wellContentsSelectors.selectedWellsMaxVolume(state),

    _labwareId: labwareIngredSelectors.getSelectedContainerId(state),
    _selectedWells: selectedWells,
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_labwareId, _selectedWells, ...passThruProps} = stateProps
  const {dispatch} = dispatchProps
  return {
    ...passThruProps,
    cancelForm: () => dispatch(deselectAllWells()),
    clearWells: () => global.alert('"Clear Wells" is not yet implemented'), // TODO: Ian 2018-10-19
    saveForm: (values: ValidFormValues) => {
      const volume = Number(values.volume)

      assert(
        _labwareId != null,
        'when saving liquid placement form, expected a selected labware ID')
      assert(
        _selectedWells && _selectedWells.length > 0,
        `when saving liquid placement form, expected selected wells to be array with length > 0 but got ${String(_selectedWells)}`)
      assert(
        volume > 0,
        `when saving liquid placement form, expected volume > 0, got ${volume}`)

      if (_labwareId != null) {
        dispatch(setWellContents({
          liquidGroupId: values.selectedLiquidId,
          labwareId: _labwareId,
          wells: _selectedWells || [],
          volume: Number(values.volume),
        }))
      }
    },
  }
}

export default connect(mapStateToProps, null, mergeProps)(LiquidPlacementForm)
