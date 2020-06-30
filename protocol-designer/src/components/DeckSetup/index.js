// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import type { InitialDeckSetup } from '../../step-forms'

import type { TerminalItemId } from '../../steplist'
import type { BaseState, ThunkDispatch } from '../../types'
import { DeckSetup as DeckSetupComponent } from './DeckSetup'

type Props = React.ElementProps<typeof DeckSetupComponent>

type SP = {|
  selectedTerminalItemId: ?TerminalItemId,
  drilledDown: boolean,
  initialDeckSetup: InitialDeckSetup,
|}

type DP = {| drillUpFromLabware: () => mixed |}

const mapStateToProps = (state: BaseState): SP => ({
  selectedTerminalItemId: getSelectedTerminalItemId(state),
  drilledDown: labwareIngredSelectors.getDrillDownLabwareId(state) != null,
  initialDeckSetup: stepFormSelectors.getInitialDeckSetup(state),
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  drillUpFromLabware: () => dispatch(labwareIngredActions.drillUpFromLabware()),
})

const mergeProps = (stateProps: SP, dispatchProps: DP): Props => ({
  selectedTerminalItemId: stateProps.selectedTerminalItemId,
  drilledDown: stateProps.drilledDown,
  initialDeckSetup: stateProps.initialDeckSetup,
  handleClickOutside: () => {
    if (stateProps.drilledDown) dispatchProps.drillUpFromLabware()
  },
})

export const DeckSetup: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckSetupComponent)
