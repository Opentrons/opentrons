import * as React from 'react'
import cx from 'classnames'
import {
  DeprecatedPrimaryButton,
  AlertModal,
  OutlineButton,
  SidePanel,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { resetScrollElements } from '../../ui/steps/utils'
import { Portal } from '../portals/MainPageModalPortal'
import { useBlockingHint } from '../Hints/useBlockingHint'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { getUnusedEntities } from './utils'
import modalStyles from '../modals/modal.css'
import styles from './FileSidebar.css'

import { HintKey } from '../../tutorial'
import type {
  InitialDeckSetup,
  SavedStepFormState,
  ModuleOnDeck,
  PipetteOnDeck,
} from '../../step-forms'
import type {
  CreateCommand,
  ProtocolFile,
  RobotType,
} from '@opentrons/shared-data'

export interface Props {
  loadFile: (event: React.ChangeEvent<HTMLInputElement>) => unknown
  createNewFile?: () => unknown
  canDownload: boolean
  onDownload: () => unknown
  fileData?: ProtocolFile | null
  pipettesOnDeck: InitialDeckSetup['pipettes']
  modulesOnDeck: InitialDeckSetup['modules']
  savedStepForms: SavedStepFormState
  robotType: RobotType
  additionalEquipment: AdditionalEquipment
}

export interface AdditionalEquipment {
  [additionalEquipmentId: string]: {
    name: 'gripper'
    id: string
  }
}

interface WarningContent {
  content: React.ReactNode
  heading: string
}

interface MissingContent {
  noCommands: boolean
  pipettesWithoutStep: PipetteOnDeck[]
  modulesWithoutStep: ModuleOnDeck[]
  gripperWithoutStep: boolean
}

const LOAD_COMMANDS: Array<CreateCommand['commandType']> = [
  'loadLabware',
  'loadModule',
  'loadPipette',
  'loadLiquid',
]

function getWarningContent({
  noCommands,
  pipettesWithoutStep,
  modulesWithoutStep,
  gripperWithoutStep,
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

  if (gripperWithoutStep) {
    return {
      content: (
        <>
          <p>{i18n.t('alert.export_warnings.unused_gripper.body1')}</p>
          <p>{i18n.t('alert.export_warnings.unused_gripper.body2')}</p>
        </>
      ),
      heading: i18n.t('alert.export_warnings.unused_gripper.heading'),
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

export const v6WarningContent: JSX.Element = (
  <div>
    <p>
      {i18n.t(`alert.hint.export_v6_protocol_6_20.body1`)}{' '}
      <strong>{i18n.t(`alert.hint.export_v6_protocol_6_20.body2`)}</strong>
      {i18n.t(`alert.hint.export_v6_protocol_6_20.body3`)}
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
    robotType,
    additionalEquipment,
  } = props
  const [
    showExportWarningModal,
    setShowExportWarningModal,
  ] = React.useState<boolean>(false)
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )

  const [showBlockingHint, setShowBlockingHint] = React.useState<boolean>(false)

  const cancelModal = (): void => setShowExportWarningModal(false)

  const nonLoadCommands =
    fileData?.commands.filter(
      command => !LOAD_COMMANDS.includes(command.commandType)
    ) ?? []

  const gripperInUse =
    fileData?.commands.find(
      command =>
        command.commandType === 'moveLabware' &&
        command.params.strategy === 'usingGripper'
    ) != null

  const noCommands = fileData ? nonLoadCommands.length === 0 : true
  const pipettesWithoutStep = getUnusedEntities(
    pipettesOnDeck,
    savedStepForms,
    'pipette',
    robotType
  )
  const modulesWithoutStep = getUnusedEntities(
    modulesOnDeck,
    savedStepForms,
    'moduleId',
    robotType
  )

  const gripperWithoutStep = isGripperAttached && !gripperInUse

  const hasWarning =
    noCommands ||
    modulesWithoutStep.length ||
    pipettesWithoutStep.length ||
    gripperWithoutStep

  const warning =
    hasWarning &&
    getWarningContent({
      noCommands,
      pipettesWithoutStep,
      modulesWithoutStep,
      gripperWithoutStep,
    })

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
                  setShowExportWarningModal(false)
                  setShowBlockingHint(true)
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
            <DeprecatedPrimaryButton
              onClick={() => {
                if (hasWarning) {
                  resetScrollElements()
                  setShowExportWarningModal(true)
                } else {
                  resetScrollElements()
                  setShowBlockingHint(true)
                }
              }}
              disabled={!canDownload}
            >
              Export
            </DeprecatedPrimaryButton>
          </div>
        </div>
      </SidePanel>
    </>
  )
}
