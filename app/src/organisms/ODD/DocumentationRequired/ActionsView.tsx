import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  COLORS,
  getLabwareDefinitionsFromCommands,
  useCommandTextString,
} from '@opentrons/components'

import { i18n } from '/app/i18n'
import { OddModal } from '/app/molecules/OddModal'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import styles from './documentationrequired.module.css'

import type { TFunction } from 'i18next'
import type { CommandTextData, IconName } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { PipetteWizardFlowAction } from '@opentrons/react-api-client/src/access_control/types'
import type { LabwareDefinition, RunTimeCommand } from '@opentrons/shared-data'

const ActionsViewImpl = ({
  actionsToDocument,
}: {
  actionsToDocument: DocumentedAction[]
}): JSX.Element => {
  const { t } = useTranslation(['access_control', 'shared'])
  const modal = useModal()
  const allRunTimeCommands = actionsToDocument.filter(isRunTimeCommand)
  const allRunDefs = getLabwareDefinitionsFromCommands(allRunTimeCommands)
  const { data } = useNotifyCurrentMaintenanceRun()
  const commandTextData =
    data != null
      ? {
          pipettes: data?.data.pipettes ?? [],
          labware: data?.data.labware ?? [],
          modules: data?.data.modules ?? [],
          liquids: data?.data.liquids ?? [],
          commands: allRunTimeCommands,
        }
      : null

  const actionViewHeader = {
    title: t('actions_requiring_documentation'),
    hasExitIcon: true,
    iconName: 'information' as IconName,
    iconColor: COLORS.black90,
    onClick: modal.remove,
  }
  return (
    <OddModal
      header={actionViewHeader}
      modalZIndex={1002}
      onOutsideClick={modal.remove}
    >
      <div className={styles.actions_list}>
        {actionsToDocument.map((action, i) => (
          <ActionItem
            key={`action-${i}`}
            action={action}
            allRunDefs={allRunDefs}
            commandTextData={commandTextData}
          />
        ))}
      </div>
    </OddModal>
  )
}

const ActionItem = ({
  action,
  allRunDefs,
  commandTextData,
}: {
  action: DocumentedAction
  allRunDefs: LabwareDefinition[]
  commandTextData: CommandTextData | null
}): JSX.Element => {
  const { t } = useTranslation(['audit_log'])
  if (typeof action === 'string') {
    // AuditLog
    return <div className={styles.action}>{t(action)}</div>
  }
  // RunTimeCommand
  if ('commandType' in action && commandTextData != null) {
    return (
      <DocumentedCommandText
        action={action}
        allRunDefs={allRunDefs}
        commandTextData={commandTextData}
      />
    )
  }
  // PipetteWizardFlow
  if ('type' in action && action.type === 'pipette_wizard_flow') {
    return <PipetteFlowText action={action} t={t} />
  }
  return <div className={styles.action}>{JSON.stringify(action)}</div>
}

function DocumentedCommandText({
  action,
  allRunDefs,
  commandTextData,
}: {
  action: RunTimeCommand
  allRunDefs: LabwareDefinition[]
  commandTextData: CommandTextData
}): JSX.Element {
  const commandInfo = useCommandTextString({
    command: action,
    allRunDefs,
    robotType: 'OT-3 Standard',
    commandTextData,
  })

  return <div className={styles.action}>{commandInfo.commandText}</div>
}

function isRunTimeCommand(action: DocumentedAction): action is RunTimeCommand {
  return typeof action === 'object' && 'commandType' in action
}

function PipetteFlowText({
  action,
  t,
}: {
  action: PipetteWizardFlowAction
  t: TFunction
}): JSX.Element {
  const { flowType, pipette, mount, pipetteInfo, step } = action
  const mountName = mount === 'left' ? t('left_mount') : t('right_mount')
  const flowTypeText =
    flowType === 'ATTACH'
      ? t('attach')
      : flowType === 'DETACH'
        ? t('detach')
        : t('calibrate')
  const pipetteCategoryText =
    pipette === '96-Channel'
      ? t('96_channel')
      : t('single_channel_and_8_channel')

  const pipetteNameText = pipetteInfo?.displayName

  const endText = step === 'end' ? t('end') + ' ' : ''

  const text =
    endText +
    t('pipette_wizard_flow', {
      flowtype: endText ? i18n.format(flowTypeText, 'lowerCase') : flowTypeText,
      pipette: pipetteNameText || pipetteCategoryText,
      mount: mountName,
    })

  return <div className={styles.action}>{text}</div>
}

export const ActionsView = NiceModal.create(ActionsViewImpl)
