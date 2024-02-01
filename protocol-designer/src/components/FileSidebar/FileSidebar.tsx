import * as React from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DeprecatedPrimaryButton,
  AlertModal,
  OutlineButton,
  SidePanel,
} from '@opentrons/components'
import {
  actions as loadFileActions,
  selectors as loadFileSelectors,
} from '../../load-file'
import { actions, selectors } from '../../navigation'
import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getRobotType } from '../../file-data/selectors'
import { getAdditionalEquipment } from '../../step-forms/selectors'
import { resetScrollElements } from '../../ui/steps/utils'
import { Portal } from '../portals/MainPageModalPortal'
import { useBlockingHint } from '../Hints/useBlockingHint'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import {
  getUnusedEntities,
  getUnusedTrash,
  getUnusedStagingAreas,
} from './utils'
import modalStyles from '../modals/modal.module.css'
import styles from './FileSidebar.module.css'

import type {
  CreateCommand,
  ProtocolFile,
  RobotType,
} from '@opentrons/shared-data'
import type { HintKey } from '../../tutorial'
import type {
  InitialDeckSetup,
  SavedStepFormState,
  ModuleOnDeck,
  PipetteOnDeck,
} from '../../step-forms'
import type { ThunkDispatch } from '../../types'

export interface AdditionalEquipment {
  [additionalEquipmentId: string]: {
    name: 'gripper' | 'wasteChute' | 'stagingArea' | 'trashBin'
    id: string
    location?: string
  }
}

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

interface WarningContent {
  content: React.ReactNode
  heading: string
}

interface Fixture {
  trashBin: boolean
  wasteChute: boolean
  stagingAreaSlots: string[]
}
interface MissingContent {
  noCommands: boolean
  pipettesWithoutStep: PipetteOnDeck[]
  modulesWithoutStep: ModuleOnDeck[]
  gripperWithoutStep: boolean
  fixtureWithoutStep: Fixture
  t: any
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
  fixtureWithoutStep,
  t,
}: MissingContent): WarningContent | null {
  if (noCommands) {
    return {
      content: (
        <>
          <p>{t('export_warnings.no_commands.body1')}</p>
          <p>
            {t('export_warnings.no_commands.body2')}
            <KnowledgeBaseLink to="protocolSteps">here</KnowledgeBaseLink>.
          </p>
        </>
      ),
      heading: t('export_warnings.no_commands.heading'),
    }
  }

  if (gripperWithoutStep) {
    return {
      content: (
        <>
          <p>{t('export_warnings.unused_gripper.body1')}</p>
          <p>{t('export_warnings.unused_gripper.body2')}</p>
        </>
      ),
      heading: t('export_warnings.unused_gripper.heading'),
    }
  }

  const pipettesDetails = pipettesWithoutStep
    .map(pipette => `${pipette.mount} ${pipette.spec.displayName}`)
    .join(' and ')
  const modulesDetails = modulesWithoutStep
    .map(moduleOnDeck => t(`modules:module_long_names.${moduleOnDeck.type}`))
    .join(' and ')

  if (pipettesWithoutStep.length && modulesWithoutStep.length) {
    return {
      content: (
        <>
          <p>
            {t('export_warnings.unused_pipette_and_module.body1', {
              modulesDetails,
              pipettesDetails,
            })}
          </p>
          <p>{t('export_warnings.unused_pipette_and_module.body2')}</p>
        </>
      ),
      heading: t('export_warnings.unused_pipette_and_module.heading'),
    }
  }

  if (pipettesWithoutStep.length) {
    return {
      content: (
        <>
          <p>
            {t('export_warnings.unused_pipette.body1', {
              pipettesDetails,
            })}
          </p>
          <p>{t('export_warnings.unused_pipette.body2')}</p>
        </>
      ),
      heading: t('export_warnings.unused_pipette.heading'),
    }
  }

  if (modulesWithoutStep.length) {
    const moduleCase =
      modulesWithoutStep.length > 1 ? 'unused_modules' : 'unused_module'
    return {
      content: (
        <>
          <p>
            {t(`export_warnings.${moduleCase}.body1`, {
              modulesDetails,
            })}
          </p>
          <p>{t(`export_warnings.${moduleCase}.body2`)}</p>
        </>
      ),
      heading: t(`export_warnings.${moduleCase}.heading`),
    }
  }

  if (fixtureWithoutStep.trashBin || fixtureWithoutStep.wasteChute) {
    return {
      content:
        (fixtureWithoutStep.trashBin && !fixtureWithoutStep.wasteChute) ||
        (!fixtureWithoutStep.trashBin && fixtureWithoutStep.wasteChute) ? (
          <p>
            {t('export_warnings.unused_trash.body', {
              name: fixtureWithoutStep.trashBin ? 'trash bin' : 'waste chute',
            })}
          </p>
        ) : (
          <p>
            {t('export_warnings.unused_trash.body_both', {
              trashName: 'trash bin',
              wasteName: 'waste chute',
            })}
          </p>
        ),
      heading: t('export_warnings.unused_trash.heading'),
    }
  }

  if (fixtureWithoutStep.stagingAreaSlots.length) {
    return {
      content: (
        <>
          <p>
            {t('export_warnings.unused_staging_area.body1', {
              count: fixtureWithoutStep.stagingAreaSlots.length,
              slot: fixtureWithoutStep.stagingAreaSlots,
            })}
          </p>
          <p>
            {t('export_warnings.unused_staging_area.body2', {
              count: fixtureWithoutStep.stagingAreaSlots.length,
            })}
          </p>
        </>
      ),
      heading: t('export_warnings.unused_staging_area.heading'),
    }
  }

  return null
}

export function v8WarningContent(t: any): JSX.Element {
  return (
    <div>
      <p>
        {t(`hint.export_v8_protocol_7_1.body1`)}{' '}
        <strong>{t(`hint.export_v8_protocol_7_1.body2`)}</strong>
        {t(`hint.export_v8_protocol_7_1.body3`)}
      </p>
    </div>
  )
}
export function FileSidebar(): JSX.Element {
  const fileData = useSelector(fileDataSelectors.createFile)
  const canDownload = useSelector(selectors.getCurrentPage)
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const modulesOnDeck = initialDeckSetup.modules
  const pipettesOnDeck = initialDeckSetup.pipettes
  const robotType = useSelector(getRobotType)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const savedStepForms = useSelector(stepFormSelectors.getSavedStepForms)
  const newProtocolModal = useSelector(selectors.getNewProtocolModal)
  const hasUnsavedChanges = useSelector(loadFileSelectors.getHasUnsavedChanges)
  const canCreateNew = !newProtocolModal
  const dispatch: ThunkDispatch<any> = useDispatch()

  const [
    showExportWarningModal,
    setShowExportWarningModal,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation(['alert', 'modules'])
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )
  const { trashBinUnused, wasteChuteUnused } = getUnusedTrash(
    additionalEquipment,
    fileData?.commands
  )

  const fixtureWithoutStep: Fixture = {
    trashBin: trashBinUnused,
    wasteChute: wasteChuteUnused,
    stagingAreaSlots: getUnusedStagingAreas(
      additionalEquipment,
      fileData?.commands
    ),
  }
  const [showBlockingHint, setShowBlockingHint] = React.useState<boolean>(false)

  const cancelModal = (): void => setShowExportWarningModal(false)

  const loadFile = (
    fileChangeEvent: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (!hasUnsavedChanges || window.confirm(t('confirm_import'))) {
      dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
    }
  }

  const createNewFile = (): void => {
    if (canCreateNew) {
      dispatch(actions.toggleNewProtocolModal(true))
    }
  }

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
    modulesWithoutStep.length > 0 ||
    pipettesWithoutStep.length > 0 ||
    gripperWithoutStep ||
    fixtureWithoutStep.trashBin ||
    fixtureWithoutStep.wasteChute ||
    fixtureWithoutStep.stagingAreaSlots.length > 0

  const warning =
    hasWarning &&
    getWarningContent({
      noCommands,
      pipettesWithoutStep,
      modulesWithoutStep,
      gripperWithoutStep,
      fixtureWithoutStep,
      t,
    })

  const getExportHintContent = (): {
    hintKey: HintKey
    content: React.ReactNode
  } => {
    return {
      hintKey: 'export_v8_protocol_7_1',
      content: v8WarningContent(t),
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
      dispatch(loadFileActions.saveProtocolFile())
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
                children: t('cancel'),
                onClick: cancelModal,
              },
              {
                children: t('continue_with_export'),
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
            {t('create_new')}
          </OutlineButton>

          <OutlineButton Component="label" className={cx(styles.upload_button)}>
            {t('import')}
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
              {t('export')}
            </DeprecatedPrimaryButton>
          </div>
        </div>
      </SidePanel>
    </>
  )
}
