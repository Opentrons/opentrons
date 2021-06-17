import * as React from 'react'
import { connect } from 'react-redux'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import { InitialDeckSetup } from '../../step-forms'
import { DeckSetup as DeckSetupComponent } from './DeckSetup'
import { TerminalItemId } from '../../steplist'
import { BaseState, ThunkDispatch } from '../../types'
type Props = React.ComponentProps<typeof DeckSetupComponent>
interface SP {
  selectedTerminalItemId?: TerminalItemId | null
  drilledDown: boolean
  initialDeckSetup: InitialDeckSetup
}
interface DP {
  drillUpFromLabware: () => unknown
}

const mapStateToProps = (state: BaseState): SP => ({
  selectedTerminalItemId: getSelectedTerminalItemId(state),
  drilledDown: labwareIngredSelectors.getDrillDownLabwareId(state) != null,
  initialDeckSetup: stepFormSelectors.getInitialDeckSetup(state),
})

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DP => ({
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

export const DeckSetup = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckSetupComponent)
