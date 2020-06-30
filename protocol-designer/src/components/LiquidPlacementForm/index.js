// @flow
import assert from 'assert'
import * as React from 'react'
import { connect } from 'react-redux'
import isEmpty from 'lodash/isEmpty'
import type { Dispatch } from 'redux'
import {
  removeWellsContents,
  setWellContents,
} from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { getSelectedWells } from '../../well-selection/selectors'
import { deselectAllWells } from '../../well-selection/actions'
import type { BaseState } from '../../types'
import { LiquidPlacementForm as LiquidPlacementFormComponent } from './LiquidPlacementForm'
import type { LiquidPlacementFormValues } from './LiquidPlacementForm'

type Props = React.ElementProps<typeof LiquidPlacementFormComponent>

type SP = $Rest<
  {|
    ...$Exact<Props>,
    _labwareId: ?string,
    _selectedWells: ?Array<string>,
    _selectionHasLiquids: boolean,
  |},
  {|
    cancelForm: $PropertyType<Props, 'cancelForm'>,
    clearWells: $PropertyType<Props, 'clearWells'>,
    saveForm: $PropertyType<Props, 'saveForm'>,
  |}
>

function mapStateToProps(state: BaseState): SP {
  const selectedWells = getSelectedWells(state)

  const _labwareId = labwareIngredSelectors.getSelectedLabwareId(state)
  const liquidLocations = labwareIngredSelectors.getLiquidsByLabwareId(state)
  const _selectionHasLiquids = Boolean(
    _labwareId &&
      liquidLocations[_labwareId] &&
      Object.keys(selectedWells).some(well => liquidLocations[_labwareId][well])
  )

  return {
    commonSelectedLiquidId: wellContentsSelectors.getSelectedWellsCommonIngredId(
      state
    ),
    commonSelectedVolume: wellContentsSelectors.getSelectedWellsCommonVolume(
      state
    ),
    liquidSelectionOptions: labwareIngredSelectors.getLiquidSelectionOptions(
      state
    ),
    showForm: !isEmpty(selectedWells),
    selectedWellsMaxVolume: wellContentsSelectors.getSelectedWellsMaxVolume(
      state
    ),

    _labwareId,
    _selectedWells: Object.keys(selectedWells),
    _selectionHasLiquids,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: Dispatch<*> }
): Props {
  const {
    _labwareId,
    _selectedWells,
    _selectionHasLiquids,
    ...passThruProps
  } = stateProps
  const { dispatch } = dispatchProps

  const clearWells =
    _labwareId && _selectedWells && _selectionHasLiquids
      ? () => {
          // TODO: Ian 2018-10-22 replace with modal later on if we like this UX
          if (
            global.confirm(
              'Are you sure you want to remove liquids from all selected wells?'
            )
          ) {
            dispatch(
              removeWellsContents({
                labwareId: _labwareId,
                wells: _selectedWells,
              })
            )
          }
        }
      : null

  return {
    ...passThruProps,
    cancelForm: () => dispatch(deselectAllWells()),
    clearWells,
    saveForm: (values: LiquidPlacementFormValues) => {
      const { selectedLiquidId } = values
      const volume = Number(values.volume)

      assert(
        _labwareId != null,
        'when saving liquid placement form, expected a selected labware ID'
      )
      assert(
        _selectedWells && _selectedWells.length > 0,
        `when saving liquid placement form, expected selected wells to be array with length > 0 but got ${String(
          _selectedWells
        )}`
      )
      assert(
        selectedLiquidId != null,
        `when saving liquid placement form, expected selectedLiquidId to be non-nullsy but got ${String(
          selectedLiquidId
        )}`
      )
      assert(
        volume > 0,
        `when saving liquid placement form, expected volume > 0, got ${volume}`
      )

      if (_labwareId != null && selectedLiquidId != null) {
        dispatch(
          setWellContents({
            liquidGroupId: selectedLiquidId,
            labwareId: _labwareId,
            wells: _selectedWells || [],
            volume: Number(values.volume),
          })
        )
      }
    },
  }
}

export const LiquidPlacementForm: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  {||},
  _,
  _
>(
  mapStateToProps,
  null,
  mergeProps
)(LiquidPlacementFormComponent)
