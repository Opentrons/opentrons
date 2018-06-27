// @flow
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {selectors as steplistSelectors} from '../../steplist'
import Alerts from '../Alerts'
import type {BaseState} from '../../types'

type FormError = {}
type FormWarning = {dissmissId?: string} // presence of dismissId allows alert to be dismissed

type SP = { alerts: Array<FormError | FormWarning> }
type DP = { onDismiss: (id: string) => () => mixed }

// These captions populate the AlertItem body, the title/message
// comes from the CommandCreatorError / CommandCreatorWarning
const FORM_ALERT_CAPTIONS: {[warningOrErrorType: string]: string} = {
  // TODO: put form alert captions here
}

const mapStateToProps = (state: BaseState): SP => {
  const errors = steplistSelectors.currentFormErrors(state)
  const warnings = steplistSelectors.currentFormWarnings(state)

  const showWarnings = (process.env.OT_PD_SHOW_WARNINGS === 'true') // hide warnings without explicit FEATURE FLAG
  const alerts = showWarnings ? [...errors, ...warnings] : errors

  return { alerts, captions: FORM_ALERT_CAPTIONS }
}

const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  onDismiss: (id: string) => () => console.log('dismiss warning here', id)
})

export default connect(mapStateToProps, mapDispatchToProps)(Alerts)
