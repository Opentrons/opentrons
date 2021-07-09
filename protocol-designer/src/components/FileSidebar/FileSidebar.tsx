import * as React from 'react'
import cx from 'classnames'
import {
  PrimaryButton,
  AlertModal,
  OutlineButton,
  SidePanel,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { useBlockingHint } from '../Hints/useBlockingHint'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { resetScrollElements } from '../../ui/steps/utils'
import { Portal } from '../portals/MainPageModalPortal'
import { getUnusedEntities } from './utils'
import modalStyles from '../modals/modal.css'
import styles from './FileSidebar.css'

import { HintKey } from '../../tutorial'
import { PDProtocolFile } from '../../file-types'
import {
  InitialDeckSetup,
  SavedStepFormState,
  ModuleOnDeck,
  PipetteOnDeck,
} from '../../step-forms'

export interface Props {
  loadFile: (event: React.ChangeEvent<HTMLInputElement>) => unknown
  createNewFile?: () => unknown
  canDownload: boolean
  onDownload: () => unknown
  fileData?: PDProtocolFile | null
  pipettesOnDeck: InitialDeckSetup['pipettes']
  modulesOnDeck: InitialDeckSetup['modules']
  savedStepForms: SavedStepFormState
  schemaVersion: number
}

interface WarningContent {
  content: React.ReactNode
  heading: string
}

interface MissingContent {
  noCommands: boolean
  pipettesWithoutStep: PipetteOnDeck[]
  modulesWithoutStep: ModuleOnDeck[]
}

function getWarningContent({
  noCommands,
  pipettesWithoutStep,
  modulesWithoutStep,
}: MissingContent): WarningContent | null {
  if (noCommands) {
    return {
      content: (
        <>
          <p>{i18n.t('alert.export_warnings.no_commands.body1')}</p>
          <p>
            {i18n.t('alert.export_warnings.no_commands.body2')}
            <KnowledgeBaseLink to="protocolSteps">here</KnowledgeBaseLink>.
          </p>
        </>
      ),
      heading: i18n.t('alert.export_warnings.no_commands.heading'),
    }
  }

  const pipettesDetails = pipettesWithoutStep
    .map(pipette => `${pipette.mount} ${pipette.spec.displayName}`)
    .join(' and ')
  const modulesDetails = modulesWithoutStep
    .map(moduleOnDeck =>
      i18n.t(`modules.module_long_names.${moduleOnDeck.type}`)
    )
    .join(' and ')

  if (pipettesWithoutStep.length && modulesWithoutStep.length) {
    return {
      content: (
        <>
          <p>
            {i18n.t('alert.export_warnings.unused_pipette_and_module.body1', {
              modulesDetails,
              pipettesDetails,
            })}
          </p>
          <p>
            {i18n.t('alert.export_warnings.unused_pipette_and_module.body2')}
          </p>
        </>
      ),
      heading: i18n.t(
        'alert.export_warnings.unused_pipette_and_module.heading'
      ),
    }
  }

  if (pipettesWithoutStep.length) {
    return {
      content: (
        <>
          <p>
            {i18n.t('alert.export_warnings.unused_pipette.body1', {
              pipettesDetails,
            })}
          </p>
          <p>{i18n.t('alert.export_warnings.unused_pipette.body2')}</p>
        </>
      ),
      heading: i18n.t('alert.export_warnings.unused_pipette.heading'),
    }
  }

  if (modulesWithoutStep.length) {
    const moduleCase =
      modulesWithoutStep.length > 1 ? 'unused_modules' : 'unused_module'
    return {
      content: (
        <>
          <p>
            {i18n.t(`alert.export_warnings.${moduleCase}.body1`, {
              modulesDetails,
            })}
          </p>
          <p>{i18n.t(`alert.export_warnings.${moduleCase}.body2`)}</p>
        </>
      ),
      heading: i18n.t(`alert.export_warnings.${moduleCase}.heading`),
    }
  }
  return null
}

export const v4WarningContent: JSX.Element = (
  <div>
    <p>
      {i18n.t(`alert.hint.export_v4_protocol_3_18.body1`)}{' '}
      <strong>{i18n.t(`alert.hint.export_v4_protocol_3_18.body2`)}</strong>
      {i18n.t(`alert.hint.export_v4_protocol_3_18.body3`)}
    </p>
  </div>
)

export const v5WarningContent: JSX.Element = (
  <div>
    <p>
      {i18n.t(`alert.hint.export_v5_protocol_3_20.body1`)}{' '}
      <strong>{i18n.t(`alert.hint.export_v5_protocol_3_20.body2`)}</strong>
      {i18n.t(`alert.hint.export_v5_protocol_3_20.body3`)}
    </p>
  </div>
)

export function FileSidebar(props: Props): JSX.Element {
  const {
    canDownload,
    fileData,
    loadFile,
    createNewFile,
    onDownload,
    modulesOnDeck,
    pipettesOnDeck,
    savedStepForms,
    schemaVersion,
  } = props
  const [
    showExportWarningModal,
    setShowExportWarningModal,
  ] = React.useState<boolean>(false)

  const [showBlockingHint, setShowBlockingHint] = React.useState<boolean>(false)

  const cancelModal = (): void => setShowExportWarningModal(false)

  const noCommands = fileData ? fileData.commands.length === 0 : true
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

  const warning =
    hasWarning &&
    getWarningContent({
      noCommands,
      pipettesWithoutStep,
      modulesWithoutStep,
    })

  const getExportHintContent = (): {
    hintKey: HintKey
    content: React.ReactNode
  } => {
    return {
      hintKey:
        schemaVersion === 5
          ? 'export_v5_protocol_3_20'
          : 'export_v4_protocol_3_18',
      content: schemaVersion === 5 ? v5WarningContent : v4WarningContent,
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

  return (
    <>
      {blockingExportHint}
      {showExportWarningModal && (
        <Portal>
          <AlertModal
            alertOverlay
            className={modalStyles.modal}
            heading={warning && warning.heading}
            onCloseClick={cancelModal}
            buttons={[
              {
                children: 'CANCEL',
                onClick: cancelModal,
              },
              {
                children: 'CONTINUE WITH EXPORT',
                className: modalStyles.long_button,
                onClick: () => {
                  if (schemaVersion > 3) {
                    setShowExportWarningModal(false)
                    setShowBlockingHint(true)
                  } else {
                    onDownload()
                    setShowExportWarningModal(false)
                  }
                },
              },
            ]}
          >
            {warning && warning.content}
          </AlertModal>
        </Portal>
      )}
      <SidePanel title="Protocol File">
        <div className={styles.file_sidebar}>
          <OutlineButton onClick={createNewFile} className={styles.button}>
            Create New
          </OutlineButton>

          <OutlineButton Component="label" className={cx(styles.upload_button)}>
            Import
            <input type="file" onChange={loadFile} />
          </OutlineButton>

          <div className={styles.button}>
            <PrimaryButton
              onClick={() => {
                if (hasWarning) {
                  resetScrollElements()
                  setShowExportWarningModal(true)
                } else if (schemaVersion > 3) {
                  resetScrollElements()
                  setShowBlockingHint(true)
                } else {
                  onDownload()
                }
              }}
              disabled={!canDownload}
            >
              Export
            </PrimaryButton>
          </div>
        </div>
      </SidePanel>
    </>
  )
}
