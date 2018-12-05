// @flow
import {connect} from 'react-redux'
import * as React from 'react'
import type {BaseState} from '../types'
import FilePage from '../components/FilePage'
import {actions, selectors as fileSelectors} from '../file-data'
import {actions as pipetteActions, selectors as pipetteSelectors} from '../pipettes'
import type {FileMetadataFields} from '../file-data'
import {actions as navActions} from '../navigation'

type Props = React.ElementProps<typeof FilePage>

type SP = {
  instruments: $PropertyType<Props, 'instruments'>,
  formValues: $PropertyType<Props, 'formValues'>,
}

type DP = $Diff<Props, SP>

const mapStateToProps = (state: BaseState): SP => {
  const pipetteData = pipetteSelectors.getPipettesForInstrumentGroup(state)
  return {
    formValues: fileSelectors.getFileMetadata(state),
    instruments: {
      left: pipetteData.find(i => i.mount === 'left'),
      right: pipetteData.find(i => i.mount === 'right'),
    },
  }
}

const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  goToNextPage: () => dispatch(navActions.navigateToPage('liquids')),
  saveFileMetadata: (nextFormValues: FileMetadataFields) =>
    dispatch(actions.saveFileMetadata(nextFormValues)),
  swapPipettes: () => dispatch(pipetteActions.swapPipettes),
})

export default connect(mapStateToProps, mapDispatchToProps)(FilePage)
