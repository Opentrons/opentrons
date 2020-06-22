// @flow
import * as React from 'react'
import cx from 'classnames'
import { saveAs } from 'file-saver'
import {
  PrimaryButton,
  AlertModal,
  OutlineButton,
  SidePanel,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { useBlockingHint } from '../Hints/useBlockingHint'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from '../modals/modal.css'
import { getUnusedEntities } from './utils'
import styles from './FileSidebar.css'

import type { PDProtocolFile } from '../../file-types'
import type {
  InitialDeckSetup,
  SavedStepFormState,
  ModuleOnDeck,
  PipetteOnDeck,
} from '../../step-forms'

type Props = {|
  loadFile: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  createNewFile?: () => mixed,
  canDownload: boolean,
  onDownload: () => mixed,
  downloadData: {
    fileData: PDProtocolFile,
    fileName: string,
  },
  pipettesOnDeck: $PropertyType<InitialDeckSetup, 'pipettes'>,
  modulesOnDeck: $PropertyType<InitialDeckSetup, 'modules'>,
  savedStepForms: SavedStepFormState,
  isV4Protocol: boolean,
|}

const saveFile = (downloadData: $PropertyType<Props, 'downloadData'>) => {
  const blob = new Blob([JSON.stringify(downloadData.fileData)], {
    type: 'application/json',
  })
  saveAs(blob, downloadData.fileName)
}

type WarningContent = {|
  content: React.Node,
  heading: string,
|}

type MissingContent = {|
  noCommands: boolean,
  pipettesWithoutStep: Array<PipetteOnDeck>,
  modulesWithoutStep: Array<ModuleOnDeck>,
|}

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

export const v4WarningContent: React.Node = (
  <div>
    <p>
      {i18n.t(`alert.hint.export_v4_protocol_3_18.body1`)}{' '}
      <strong>{i18n.t(`alert.hint.export_v4_protocol_3_18.body2`)}</strong>
      {i18n.t(`alert.hint.export_v4_protocol_3_18.body3`)}
    </p>
  </div>
)

export function FileSidebar(props: Props): React.Node {
  const {
    canDownload,
    downloadData,
    loadFile,
    createNewFile,
    onDownload,
    modulesOnDeck,
    pipettesOnDeck,
    savedStepForms,
    isV4Protocol,
  } = props
  const [
    showExportWarningModal,
    setShowExportWarningModal,
  ] = React.useState<boolean>(false)

  const [showV4ExportWarning, setShowV4ExportWarning] = React.useState<boolean>(
    false
  )

  const cancelModal = () => setShowExportWarningModal(false)

  const noCommands = downloadData && downloadData.fileData.commands.length === 0
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

  const blockingV4ExportHint = useBlockingHint({
    enabled: isV4Protocol && showV4ExportWarning,
    hintKey: 'export_v4_protocol_3_18',
    content: v4WarningContent,
    handleCancel: () => setShowV4ExportWarning(false),
    handleContinue: () => {
      setShowV4ExportWarning(false)
      saveFile(downloadData)
    },
  })

  const scrollToTop = () => {
    const editPage = document.getElementById('main-page')
    if (editPage) editPage.scrollTop = 0
  }

  return (
    <>
      {blockingV4ExportHint}
      {showExportWarningModal && (
        <Portal>
          <AlertModal
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
                  if (isV4Protocol) {
                    setShowExportWarningModal(false)
                    setShowV4ExportWarning(true)
                  } else {
                    saveFile(downloadData)
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
                  scrollToTop()
                  setShowExportWarningModal(true)
                } else if (isV4Protocol) {
                  scrollToTop()
                  setShowV4ExportWarning(true)
                } else {
                  saveFile(downloadData)
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
