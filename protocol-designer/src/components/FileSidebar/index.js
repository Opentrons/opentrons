// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { i18n } from '../../localization'
import { actions, selectors } from '../../navigation'
import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  actions as loadFileActions,
  selectors as loadFileSelectors,
} from '../../load-file'
import { FileSidebar as FileSidebarComponent } from './FileSidebar'
import type { BaseState, ThunkDispatch } from '../../types'
import type { ModuleEntities, PipetteDisplayProperties } from '../../step-forms'

type Props = React.ElementProps<typeof FileSidebarComponent>

type SP = {|
  canDownload: boolean,
  downloadData: $PropertyType<Props, 'downloadData'>,
  _canCreateNew: ?boolean,
  _hasUnsavedChanges: ?boolean,
  pipetteEntities: PipetteDisplayProperties,
  moduleEntities: ModuleEntities,
  savedStepForms: any,
|}

export const FileSidebar = connect<Props, {||}, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(FileSidebarComponent)

function mapStateToProps(state: BaseState): SP {
  const protocolName =
    fileDataSelectors.getFileMetadata(state).protocolName || 'untitled'
  const fileData = fileDataSelectors.createFile(state)
  const canDownload = selectors.getCurrentPage(state) !== 'file-splash'

  return {
    canDownload,
    downloadData: {
      fileData,
      fileName: protocolName + '.json',
    },
    pipetteEntities: stepFormSelectors.getPipetteDisplayProperties(state),
    moduleEntities: stepFormSelectors.getModuleEntities(state),
    savedStepForms: stepFormSelectors.getSavedStepForms(state),
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> }
): Props {
  const {
    _canCreateNew,
    _hasUnsavedChanges,
    canDownload,
    downloadData,
    pipetteEntities,
    moduleEntities,
    savedStepForms,
  } = stateProps
  const { dispatch } = dispatchProps
  return {
    loadFile: fileChangeEvent => {
      if (
        !_hasUnsavedChanges ||
        window.confirm(i18n.t('alert.window.confirm_import'))
      ) {
        dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
      }
    },
    canDownload,
    createNewFile: _canCreateNew
      ? () => dispatch(actions.toggleNewProtocolModal(true))
      : undefined,
    onDownload: () => dispatch(loadFileActions.saveProtocolFile()),
    downloadData,
    pipetteEntities,
    moduleEntities,
    savedStepForms,
  }
}
