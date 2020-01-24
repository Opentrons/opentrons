// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { i18n } from '../../localization'
import { actions, selectors } from '../../navigation'
import { selectors as fileDataSelectors } from '../../file-data'
import {
  actions as loadFileActions,
  selectors as loadFileSelectors,
} from '../../load-file'
import { FileSidebar as FileSidebarComponent } from './FileSidebar'
import type { BaseState, ThunkDispatch } from '../../types'

type Props = React.ElementProps<typeof FileSidebarComponent>

type SP = {|
  canDownload: boolean,
  downloadData: $PropertyType<Props, 'downloadData'>,
  _canCreateNew: ?boolean,
  _hasUnsavedChanges: ?boolean,
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
  }
}
