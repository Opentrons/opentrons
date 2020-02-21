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
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from '../modals/modal.css'
import { getUnusedModules, getUnusedPipettes } from './utils'
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
    .map(module => i18n.t(`modules.module_long_names.${module.type}`))
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

export function FileSidebar(props: Props) {
  const {
    canDownload,
    downloadData,
    loadFile,
    createNewFile,
    onDownload,
    modulesOnDeck,
    pipettesOnDeck,
    savedStepForms,
  } = props
  const [
    showExportWarningModal,
    setShowExportWarningModal,
  ] = React.useState<boolean>(false)
  const cancelModal = () => setShowExportWarningModal(false)

  const noCommands = downloadData && downloadData.fileData.commands.length === 0
  const pipettesWithoutStep = getUnusedPipettes(pipettesOnDeck, savedStepForms)
  const modulesWithoutStep = getUnusedModules(modulesOnDeck, savedStepForms)

  const hasWarning =
    noCommands || modulesWithoutStep.length || pipettesWithoutStep.length

  const warning =
    hasWarning &&
    getWarningContent({
      noCommands,
      pipettesWithoutStep,
      modulesWithoutStep,
    })

  return (
    <>
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
                  saveFile(downloadData)
                  setShowExportWarningModal(false)
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
                  setShowExportWarningModal(true)
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
