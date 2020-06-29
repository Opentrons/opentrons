// @flow
import mapValues from 'lodash/mapValues'
import * as React from 'react'
import { connect } from 'react-redux'

import { FilePage } from '../components/FilePage'
import { INITIAL_DECK_SETUP_STEP_ID } from '../constants'
import { selectors as featureFlagSelectors } from '../feature-flags'
import type { FileMetadataFields } from '../file-data'
import { actions, selectors as fileSelectors } from '../file-data'
import { actions as navActions } from '../navigation'
import type { InitialDeckSetup } from '../step-forms'
import { selectors as stepFormSelectors } from '../step-forms'
import { actions as steplistActions } from '../steplist'
import type { BaseState, ThunkDispatch } from '../types'

type Props = React.ElementProps<typeof FilePage>

type SP = {|
  instruments: $PropertyType<Props, 'instruments'>,
  formValues: $PropertyType<Props, 'formValues'>,
  _initialDeckSetup: InitialDeckSetup,
  thermocyclerEnabled: ?boolean,
  modules: $PropertyType<Props, 'modules'>,
|}

const mapStateToProps = (state: BaseState): SP => {
  return {
    formValues: fileSelectors.getFileMetadata(state),
    instruments: stepFormSelectors.getPipettesForInstrumentGroup(state),
    modules: stepFormSelectors.getModulesForEditModulesCard(state),
    _initialDeckSetup: stepFormSelectors.getInitialDeckSetup(state),
    thermocyclerEnabled: featureFlagSelectors.getEnableThermocycler(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> }
): Props {
  const { _initialDeckSetup, ...passThruProps } = stateProps
  const { dispatch } = dispatchProps
  const swapPipetteUpdate = mapValues(_initialDeckSetup.pipettes, pipette => {
    if (!pipette.mount) return pipette.mount
    return pipette.mount === 'left' ? 'right' : 'left'
  })

  return {
    ...passThruProps,
    goToNextPage: () => dispatch(navActions.navigateToPage('liquids')),
    saveFileMetadata: (nextFormValues: FileMetadataFields) =>
      dispatch(actions.saveFileMetadata(nextFormValues)),
    swapPipettes: () =>
      dispatch(
        steplistActions.changeSavedStepForm({
          stepId: INITIAL_DECK_SETUP_STEP_ID,
          update: { pipetteLocationUpdate: swapPipetteUpdate },
        })
      ),
  }
}

export const ConnectedFilePage: React.AbstractComponent<{||}> = connect<
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
)(FilePage)
