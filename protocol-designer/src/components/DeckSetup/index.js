// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { selectors as stepsSelectors } from '../../ui/steps'
import DeckSetup from './DeckSetup'

import type { TerminalItemId } from '../../steplist'
import type { BaseState, ThunkDispatch } from '../../types'

type Props = React.ElementProps<typeof DeckSetup>

type SP = {|
  selectedTerminalItemId: ?TerminalItemId,
  ingredSelectionMode: boolean,
  drilledDown: boolean,
|}

type DP = {| drillUpFromLabware: () => mixed |}

const mapStateToProps = (state: BaseState): SP => ({
  selectedTerminalItemId: stepsSelectors.getSelectedTerminalItemId(state),
  ingredSelectionMode:
    labwareIngredSelectors.getSelectedLabwareId(state) != null,
  drilledDown: labwareIngredSelectors.getDrillDownLabwareId(state) != null,
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  drillUpFromLabware: () => dispatch(labwareIngredActions.drillUpFromLabware()),
})

const mergeProps = (stateProps: SP, dispatchProps: DP): Props => ({
  selectedTerminalItemId: stateProps.selectedTerminalItemId,
  ingredSelectionMode: stateProps.ingredSelectionMode,
  drilledDown: stateProps.drilledDown,
  handleClickOutside: () => {
    if (stateProps.drilledDown) dispatchProps.drillUpFromLabware()
  },
})

export default connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckSetup)
