import { connect } from 'react-redux'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { DeckSetup as DeckSetupComponent, DeckSetupProps } from './DeckSetup'
import { TerminalItemId } from '../../steplist'
import { BaseState, ThunkDispatch } from '../../types'

type Props = DeckSetupProps
interface SP {
  selectedTerminalItemId?: TerminalItemId | null
  drilledDown: boolean
}
interface DP {
  drillUpFromLabware: () => unknown
}

const mapStateToProps = (state: BaseState): SP => ({
  selectedTerminalItemId: getSelectedTerminalItemId(state),
  drilledDown: labwareIngredSelectors.getDrillDownLabwareId(state) != null,
})

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DP => ({
  drillUpFromLabware: () => dispatch(labwareIngredActions.drillUpFromLabware()),
})

const mergeProps = (stateProps: SP, dispatchProps: DP): Props => ({
  selectedTerminalItemId: stateProps.selectedTerminalItemId,
  drilledDown: stateProps.drilledDown,
  handleClickOutside: () => {
    if (stateProps.drilledDown) dispatchProps.drillUpFromLabware()
  },
})

export const DeckSetup = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckSetupComponent)
