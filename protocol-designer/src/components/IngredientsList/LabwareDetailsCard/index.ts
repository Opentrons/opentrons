import { connect } from 'react-redux'
import assert from 'assert'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  LabwareDetailsCard as LabwareDetailsCardComponent,
  Props as LabwareDetailsCardProps,
} from './LabwareDetailsCard'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { BaseState, ThunkDispatch } from '../../../types'
type SP = Omit<LabwareDetailsCardProps, 'renameLabware'> & {
  _labwareId?: string
}

function mapStateToProps(state: BaseState): SP {
  const labwareNicknamesById = uiLabwareSelectors.getLabwareNicknamesById(state)
  const labwareId = labwareIngredSelectors.getSelectedLabwareId(state)
  const labwareDefDisplayName =
    labwareId &&
    getLabwareDisplayName(
      stepFormSelectors.getLabwareEntities(state)[labwareId].def
    )
  assert(
    labwareId,
    'Expected labware id to exist in connected labware details card'
  )

  if (!labwareId || !labwareDefDisplayName) {
    return {
      labwareDefDisplayName: '?',
      nickname: '?',
    }
  }

  return {
    labwareDefDisplayName,
    nickname: labwareNicknamesById[labwareId] || 'Unnamed Labware',
    _labwareId: labwareId,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): LabwareDetailsCardProps {
  const dispatch = dispatchProps.dispatch
  const { _labwareId, ...passThruProps } = stateProps

  const renameLabware = (name: string): void => {
    assert(
      _labwareId,
      'renameLabware in LabwareDetailsCard expected a labwareId'
    )

    if (_labwareId) {
      dispatch(
        labwareIngredActions.renameLabware({
          labwareId: _labwareId,
          name,
        })
      )
    }
  }

  return { ...passThruProps, renameLabware }
}

export const LabwareDetailsCard = connect(
  mapStateToProps,
  null,
  mergeProps
)(LabwareDetailsCardComponent)
