// @flow
import {connect} from 'react-redux'
import type {BaseState} from '../types'
import FilePage from '../components/FilePage'
import type {Props as FilePageProps} from '../components/FilePage'
import {actions, selectors as fileSelectors} from '../file-data'
import {actions as pipetteActions, selectors as pipetteSelectors} from '../pipettes'
import type {FileMetadataFields, FileMetadataFieldAccessors} from '../file-data'
import {actions as navActions} from '../navigation'
import {formConnectorFactory, type FormConnector} from '../utils'

type SP = {
  instruments: $PropertyType<FilePageProps, 'instruments'>,
  isFormAltered: $PropertyType<FilePageProps, 'isFormAltered'>,
  formValues: {[accessor: FileMetadataFieldAccessors]: any},
}

type DP = {
  _updateFileMetadataFields: typeof actions.updateFileMetadataFields,
  _saveFileMetadata: ({[accessor: FileMetadataFieldAccessors]: mixed}) => mixed,
  goToNextPage: $PropertyType<FilePageProps, 'goToNextPage'>,
  swapPipettes: $PropertyType<FilePageProps, 'swapPipettes'>,
}

const mapStateToProps = (state: BaseState): SP => {
  const pipetteData = pipetteSelectors.getPipettesForInstrumentGroup(state)
  return {
    formValues: fileSelectors.fileFormValues(state),
    isFormAltered: fileSelectors.isUnsavedMetadatFormAltered(state),
    instruments: {
      left: pipetteData.find(i => i.mount === 'left'),
      right: pipetteData.find(i => i.mount === 'right'),
    },
  }
}

const mapDispatchToProps: DP = {
  _updateFileMetadataFields: actions.updateFileMetadataFields,
  _saveFileMetadata: actions.saveFileMetadata,
  goToNextPage: () => navActions.navigateToPage('liquids'),
  swapPipettes: pipetteActions.swapPipettes,
}

const mergeProps = (
  {instruments, isFormAltered, formValues}: SP,
  {_updateFileMetadataFields, _saveFileMetadata, goToNextPage, swapPipettes}: DP
): FilePageProps => {
  const onChange = (accessor) => (e: SyntheticInputEvent<*>) => {
    if (accessor === 'protocol-name' || accessor === 'description' || accessor === 'author') {
      _updateFileMetadataFields({[accessor]: e.target.value})
    } else {
      console.warn('Invalid accessor in ConnectedFilePage:', accessor)
    }
  }

  const formConnector: FormConnector<FileMetadataFields> = formConnectorFactory(onChange, formValues)

  return {
    formValues,
    formConnector,
    isFormAltered,
    instruments,
    goToNextPage,
    saveFileMetadata: () => _saveFileMetadata(formValues),
    swapPipettes,
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(FilePage)
