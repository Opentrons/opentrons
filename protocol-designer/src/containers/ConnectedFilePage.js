// @flow
import {connect} from 'react-redux'
import type {BaseState} from '../types'
import FilePage from '../components/FilePage'
import type {FilePageProps} from '../components/FilePage'
import {actions, selectors as fileSelectors} from '../file-data'
import {actions as pipetteActions, selectors as pipetteSelectors} from '../pipettes'
import type {FileMetadataFields, FileMetadataFieldAccessors} from '../file-data'
import {actions as navActions} from '../navigation'
import {formConnectorFactory, type FormConnector} from '../utils'

type SP = {
  instruments: $PropertyType<FilePageProps, 'instruments'>,
  isFormAltered: $PropertyType<FilePageProps, 'isFormAltered'>,
  _values: {[accessor: FileMetadataFieldAccessors]: string},
}

type DP = {
  _updateFileMetadataFields: typeof actions.updateFileMetadataFields,
  _saveFileMetadata: ({[accessor: FileMetadataFieldAccessors]: string}) => mixed,
  goToDesignPage: $PropertyType<FilePageProps, 'goToDesignPage'>,
  swapPipettes: $PropertyType<FilePageProps, 'swapPipettes'>,
}

const mapStateToProps = (state: BaseState): SP => {
  const pipetteData = pipetteSelectors.pipettesForInstrumentGroup(state)
  return {
    _values: fileSelectors.fileFormValues(state),
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
  goToDesignPage: () => navActions.navigateToPage('steplist'),
  swapPipettes: pipetteActions.swapPipettes,
}

const mergeProps = (
  {instruments, isFormAltered, _values}: SP,
  {_updateFileMetadataFields, _saveFileMetadata, goToDesignPage, swapPipettes}: DP
): FilePageProps => {
  const onChange = (accessor) => (e: SyntheticInputEvent<*>) => {
    if (accessor === 'name' || accessor === 'description' || accessor === 'author') {
      _updateFileMetadataFields({[accessor]: e.target.value})
    } else {
      console.warn('Invalid accessor in ConnectedFilePage:', accessor)
    }
  }

  const formConnector: FormConnector<FileMetadataFields> = formConnectorFactory(onChange, _values)

  return {
    formConnector,
    isFormAltered,
    instruments,
    goToDesignPage,
    saveFileMetadata: () => _saveFileMetadata(_values),
    swapPipettes,
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(FilePage)
