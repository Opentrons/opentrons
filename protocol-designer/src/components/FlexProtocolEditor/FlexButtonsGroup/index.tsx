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
import {
  Props,
  getWarningContent,
  v6WarningContent,
} from '../../FileSidebar/FileSidebar'
import { selectors } from '../../../navigation'
import { ExportJsonAlert } from './ExportToJsonAlert'
import cx from 'classnames'
import { resetScrollElements } from '../../../ui/steps/utils'
import { useBlockingHint } from '../../Hints/useBlockingHint'
import { HintKey } from '../../../tutorial'

const LOAD_COMMANDS: Array<CreateCommand['commandType']> = [
  'loadLabware',
  'loadModule',
  'loadPipette',
  'loadLiquid',
]

interface FlexHeadingButtonGroupProps {
  protocolCancelClickProps: (e: MouseEvent) => unknown
  fileData?: ProtocolFile | null
  pipettesOnDeck: InitialDeckSetup['pipettes']
  modulesOnDeck: InitialDeckSetup['modules']
  savedStepForms: SavedStepFormState
  onDownload: () => unknown
  page: string
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
    page,
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

  const [
    showExportWarningModal,
    setShowExportWarningModal,
  ] = React.useState<boolean>(false)

  const hasWarning =
    noCommands || modulesWithoutStep.length || pipettesWithoutStep.length
  const [showBlockingHint, setShowBlockingHint] = React.useState<boolean>(false)
  const warning =
    hasWarning &&
    getWarningContent({
      noCommands,
      pipettesWithoutStep,
      modulesWithoutStep,
    })

  const export_btn_hover = cx(
    (!noCommands || page === 'file-detail') && styles.export_protocol_button
  )

  const getExportHintContent = (): {
    hintKey: HintKey
    content: React.ReactNode
  } => {
    return {
      hintKey: 'export_v6_protocol_6_20',
      content: v6WarningContent,
    }
  }

  const { hintKey, content } = getExportHintContent()

  const blockingExportHint = useBlockingHint({
    enabled: showBlockingHint,
    hintKey,
    content,
    handleCancel: () => setShowBlockingHint(false),
    handleContinue: () => {
      setShowBlockingHint(false)
      onDownload()
    },
  })

  const propsData = {
    blockingExportHint,
    warning,
    showExportWarningModal,
    setShowBlockingHint,
    onDownload,
    setShowExportWarningModal,
  }
  return (
    <>
      {warning && <ExportJsonAlert {...propsData} />}{' '}
      <div className={styles.right_buttons}>
        <SecondaryButton
          className={export_btn_hover}
          disabled={noCommands && page !== 'file-detail'}
          onClick={() => {
            if (hasWarning) {
              resetScrollElements()
              setShowExportWarningModal(true)
            } else {
              resetScrollElements()
              setShowBlockingHint(true)
            }
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
    </>
  )
}

const mapStateToProps = (
  state: BaseState,
  ownProps: any
): FlexHeadingButtonGroupProps => {
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  const fileData = fileDataSelectors.createFile(state)

  return {
    ...ownProps,
    fileData,
    pipettesOnDeck: initialDeckSetup.pipettes,
    modulesOnDeck: initialDeckSetup.modules,
    savedStepForms: stepFormSelectors.getSavedStepForms(state),
    page: selectors.getCurrentPage(state),
  }
}

const mergeProps = (
  stateProps: FlexHeadingButtonGroupProps,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): FlexHeadingButtonGroupProps => {
  const {
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    protocolCancelClickProps,
    page,
  } = stateProps

  const { dispatch } = dispatchProps

  return {
    onDownload: () => dispatch(loadFileActions.saveProtocolFile()),
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    protocolCancelClickProps,
    page,
  }
}

export const FlexHeadingButtonGroup = connect(
  mapStateToProps,
  // @ts-expect-error
  null,
  mergeProps
)(FlexHeadingButtons)
