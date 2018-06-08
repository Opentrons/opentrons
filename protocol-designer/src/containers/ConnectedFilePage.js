// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState} from '../types'

import FilePage from '../components/FilePage'

import {actions, selectors} from '../file-data'
import type {FileMetadataFields} from '../file-data'
import {formConnectorFactory, type FormConnector} from '../utils'

type OP = React.ElementProps<typeof FilePage>
type SP = {
  instruments: $PropertyType<OP, 'instruments'>,
  _values: {[string]: string}
}
type DP = {
  _updateFileMetadataFields: typeof actions.updateFileMetadataFields,
  saveFileMetadata: () => void
}

const mapStateToProps = (state: BaseState): SP => {
  const pipetteData = selectors.pipettesForInstrumentGroup(state)
  return {
    _values: selectors.fileFormValues(state),
    isFormAltered: selectors.isUnsavedMetadatFormAltered(state),
    instruments: {
      left: pipetteData.find(i => i.mount === 'left'),
      right: pipetteData.find(i => i.mount === 'right')
    }
  }
}

const mapDispatchToProps = {
  _updateFileMetadataFields: actions.updateFileMetadataFields,
  _saveFileMetadata: actions.saveFileMetadata
}

const mergeProps = (
  {instruments, isFormAltered, _values}: SP,
  {_updateFileMetadataFields, _saveFileMetadata}: DP,
  ownProps: OP
) => {
  const onChange = (accessor) => (e: SyntheticInputEvent<*>) => {
    if (accessor === 'name' || accessor === 'description' || accessor === 'author') {
      _updateFileMetadataFields({[accessor]: e.target.value})
    } else {
      console.warn('Invalid accessor in ConnectedFilePage:', accessor)
    }
  }

  const formConnector: FormConnector<FileMetadataFields> = formConnectorFactory(onChange, _values)

  return {
    ...ownProps,
    formConnector,
    isFormAltered,
    instruments,
    saveFileMetadata: () => _saveFileMetadata(_values)
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(FilePage)
