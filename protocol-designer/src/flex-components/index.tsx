import * as React from 'react'

import '../css/reset.css'

import { createBrowserRouter } from 'react-router-dom'
import { ProtocolEditor } from '../components/ProtocolEditor'
import { LandingPage as LandingPageComponent, Props} from './LandingPage'
import { FlexForm } from './protocol-editor'
import { actions, selectors } from '../../src/navigation'
import { connect } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { i18n } from '../localization'
import { InitialDeckSetup, SavedStepFormState } from '../step-forms'
import { BaseState } from '../types'
import { selectors as fileDataSelectors } from '../../src/file-data'
import { selectors as stepFormSelectors } from '../../src/step-forms'
import {
  actions as loadFileActions,
  selectors as loadFileSelectors,
} from '../../src/load-file'
import { ConnectedFileTab } from './file-tab/ConnectedFileTab'

interface SP {
  canDownload: boolean
  fileData: Props['fileData']
  _canCreateNew?: boolean | null
  _hasUnsavedChanges?: boolean | null
  pipettesOnDeck: InitialDeckSetup['pipettes']
  modulesOnDeck: InitialDeckSetup['modules']
  savedStepForms: SavedStepFormState
}
export const LandingPage = connect(
  mapStateToProps,
  // @ts-expect-error(sa, 2021-6-21): TODO: refactor to use hooks api
  null,
  mergeProps
)(LandingPageComponent)

function mapStateToProps(state: BaseState): SP {
  const fileData = fileDataSelectors.createFile(state)
  const canDownload = selectors.getCurrentPage(state) !== 'file-splash'
  // selectors.getCurrentPage(state) !== 'file-splash'
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  return {
    canDownload,
    fileData,
    pipettesOnDeck: initialDeckSetup.pipettes,
    modulesOnDeck: initialDeckSetup.modules,
    savedStepForms: stepFormSelectors.getSavedStepForms(state),
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): Props {
  const {
    _canCreateNew,
    _hasUnsavedChanges,
    canDownload,
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
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
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: 'ot-flex',
    element: <FlexForm />,
  },
  {
    path: 'ot-2',
    element: <ProtocolEditor />,
  },
  {
    path: 'file-tab',
    element: <ConnectedFileTab />,
  }
])
