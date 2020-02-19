// @flow
import { connect } from 'react-redux'
import assert from 'assert'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { LabwareDetailsCard as LabwareDetailsCardComponent } from './LabwareDetailsCard'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import type { ElementProps } from 'react'
import type { BaseState, ThunkDispatch } from '../../../types'

type Props = ElementProps<typeof LabwareDetailsCardComponent>

type SP = {|
  ...$Diff<$Exact<Props>, {| renameLabware: * |}>,
  _labwareId?: string,
|}

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
  dispatchProps: { dispatch: ThunkDispatch<*> }
): Props {
  const dispatch = dispatchProps.dispatch
  const { _labwareId, ...passThruProps } = stateProps

  const renameLabware = (name: string) => {
    assert(
      _labwareId,
      'renameLabware in LabwareDetailsCard expected a labwareId'
    )
    if (_labwareId) {
      dispatch(
        labwareIngredActions.renameLabware({ labwareId: _labwareId, name })
      )
    }
  }

  return {
    ...passThruProps,
    renameLabware,
  }
}

export const LabwareDetailsCard = connect<Props, {||}, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(LabwareDetailsCardComponent)
