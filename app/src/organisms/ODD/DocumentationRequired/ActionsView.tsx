import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  COLORS,
  getLabwareDefinitionsFromCommands,
} from '@opentrons/components'

import { OddModal } from '/app/molecules/OddModal'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import { ActionItem } from './ActionItems/ActionItem'
import styles from './documentationrequired.module.css'

import type { IconName } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

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
            className={styles.action}
          />
        ))}
      </div>
    </OddModal>
  )
}

function isRunTimeCommand(action: DocumentedAction): action is RunTimeCommand {
  return typeof action === 'object' && 'commandType' in action
}

export const ActionsView = NiceModal.create(ActionsViewImpl)
