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
import type { SavedStepFormState, InitialDeckSetup } from '../../step-forms'

type Props = React.ElementProps<typeof FileSidebarComponent>

type SP = {|
  canDownload: boolean,
  downloadData: $PropertyType<Props, 'downloadData'>,
  _canCreateNew: ?boolean,
  _hasUnsavedChanges: ?boolean,
  pipettesOnDeck: $PropertyType<InitialDeckSetup, 'pipettes'>,
  modulesOnDeck: $PropertyType<InitialDeckSetup, 'modules'>,
  savedStepForms: SavedStepFormState,
  requiresAtLeastV4Protocol: boolean,
  requiresAtLeastV5Protocol: boolean,
|}

export const FileSidebar: React.AbstractComponent<{||}> = connect<
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
)(FileSidebarComponent)

function mapStateToProps(state: BaseState): SP {
  const protocolName =
    fileDataSelectors.getFileMetadata(state).protocolName || 'untitled'
  const fileData = fileDataSelectors.createFile(state)
  const canDownload = selectors.getCurrentPage(state) !== 'file-splash'
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)

  return {
    canDownload,
    downloadData: {
      fileData,
      fileName: protocolName + '.json',
    },
    pipettesOnDeck: initialDeckSetup.pipettes,
    modulesOnDeck: initialDeckSetup.modules,
    savedStepForms: stepFormSelectors.getSavedStepForms(state),
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
    requiresAtLeastV4Protocol: fileDataSelectors.getRequiresAtLeastV4(state),
    requiresAtLeastV5Protocol: fileDataSelectors.getRequiresAtLeastV5(state),
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
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    requiresAtLeastV4Protocol,
    requiresAtLeastV5Protocol,
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
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    requiresAtLeastV4Protocol,
    requiresAtLeastV5Protocol,
  }
}
