import React from 'react'
import { SecondaryButton } from '@opentrons/components'
import styles from '../FlexFileDetails/FlexFileDetails.css'
import { i18n } from '../../../localization'
import { connect } from 'react-redux'
import { selectors as fileDataSelectors } from '../../../file-data'
import {
  InitialDeckSetup,
  SavedStepFormState,
  selectors as stepFormSelectors,
} from '../../../step-forms'
import {
  actions as loadFileActions,
  selectors as loadFileSelectors,
} from '../../../load-file'
import { BaseState, ThunkDispatch } from '../../../types'
import { CreateCommand, ProtocolFile } from '@opentrons/shared-data'
import { getUnusedEntities } from '../../FileSidebar/utils'
import { Props } from '../../FileSidebar/FileSidebar'
import { actions, selectors } from '../../../navigation'

const LOAD_COMMANDS: Array<CreateCommand['commandType']> = [
  'loadLabware',
  'loadModule',
  'loadPipette',
  'loadLiquid',
]

interface FlexHeadingButtonGroupProps {
  protocolCancelClickProps: () => unknown
  fileData?: ProtocolFile | null
  pipettesOnDeck: InitialDeckSetup['pipettes']
  modulesOnDeck: InitialDeckSetup['modules']
  savedStepForms: SavedStepFormState
  onDownload: () => unknown
}

export const FlexHeadingButtons = (
  props: FlexHeadingButtonGroupProps
): JSX.Element => {
  const {
    protocolCancelClickProps,
    fileData,
    modulesOnDeck,
    pipettesOnDeck,
    savedStepForms,
    onDownload,
  } = props

  const nonLoadCommands =
    fileData?.commands.filter(
      command => !LOAD_COMMANDS.includes(command.commandType)
    ) ?? []

  const noCommands = fileData ? nonLoadCommands.length === 0 : true

  const pipettesWithoutStep = getUnusedEntities(
    pipettesOnDeck,
    savedStepForms,
    'pipette'
  )
  const modulesWithoutStep = getUnusedEntities(
    modulesOnDeck,
    savedStepForms,
    'moduleId'
  )

  const hasWarning =
    noCommands || modulesWithoutStep.length || pipettesWithoutStep.length

  //   const warning =
  //     hasWarning &&
  //     getWarningContent({
  //       noCommands,
  //       pipettesWithoutStep,
  //       modulesWithoutStep,
  //     })

  return (
    <div className={styles.right_buttons}>
      <SecondaryButton
        disabled={noCommands}
        onClick={() => {
          onDownload()
        }}
      >
        {i18n.t('flex.file_tab.export')}
      </SecondaryButton>
      <SecondaryButton
        className={styles.close_protocol_button}
        onClick={e => protocolCancelClickProps(e)}
      >
        {i18n.t('flex.file_tab.close_export')}
      </SecondaryButton>
    </div>
  )
}

const mapStateToProps = (state: BaseState, ownProps: any): SP => {
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  const fileData = fileDataSelectors.createFile(state)
  return {
    ...ownProps,
    fileData,
    pipettesOnDeck: initialDeckSetup.pipettes,
    modulesOnDeck: initialDeckSetup.modules,
    savedStepForms: stepFormSelectors.getSavedStepForms(state),
  }
}

const mergeProps = (
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): FlexHeadingButtonGroupProps => {
  const {
    _canCreateNew,
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    protocolCancelClickProps,
  } = stateProps
  const { dispatch } = dispatchProps
  return {
    onDownload: () => dispatch(loadFileActions.saveProtocolFile()),
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    protocolCancelClickProps,
  }
}

export const FlexHeadingButtonGroup = connect(
  mapStateToProps,
  // @ts-expect-error
  null,
  mergeProps
)(FlexHeadingButtons)
