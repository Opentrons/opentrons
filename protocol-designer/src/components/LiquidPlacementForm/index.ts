import { connect } from 'react-redux'
import assert from 'assert'
import isEmpty from 'lodash/isEmpty'
import {
  removeWellsContents,
  setWellContents,
} from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { getSelectedWells } from '../../well-selection/selectors'
import { deselectAllWells } from '../../well-selection/actions'
import {
  LiquidPlacementForm as LiquidPlacementFormComponent,
  Props as LiquidPlacementFormProps,
  LiquidPlacementFormValues,
} from './LiquidPlacementForm'
import { Dispatch } from 'redux'
import { BaseState } from '../../types'
import { useTranslation } from 'react-i18next'
type SP = Omit<
  LiquidPlacementFormProps & {
    _labwareId?: string | null
    _selectedWells?: string[] | null
    _selectionHasLiquids: boolean
  },
  'cancelForm' | 'clearWells' | 'saveForm'
>

function mapStateToProps(state: BaseState): SP {
  const selectedWells = getSelectedWells(state)
  const { t } = useTranslation(['form', 'button', 'application'])
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
    t: t,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: Dispatch
  }
): LiquidPlacementFormProps {
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

export const LiquidPlacementForm = connect(
  mapStateToProps,
  null,
  mergeProps
)(LiquidPlacementFormComponent)
