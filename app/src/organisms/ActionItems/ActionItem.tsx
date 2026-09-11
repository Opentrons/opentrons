import { useTranslation } from 'react-i18next'

import { AttachModuleActionText } from './AttachModuleActionText'
import { DocumentedCommandText } from './DocumentedCommandText'
import { PipetteFlowActionText } from './PipetteFlowActionText'

import type { CommandTextData } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'

export const ActionItem = ({
  action,
  allRunDefs,
  commandTextData,
  className,
}: {
  action: DocumentedAction
  allRunDefs: LabwareDefinition[]
  commandTextData: CommandTextData | null
  className?: string
}): JSX.Element => {
  const { t } = useTranslation(['audit_log', 'deck_configuration'])
  if (typeof action === 'string') {
    // AuditLog
    return <div className={className}>{t(action)}</div>
  }
  // RunTimeCommand
  if ('commandType' in action && commandTextData != null) {
    return (
      <DocumentedCommandText
        className={className}
        action={action}
        allRunDefs={allRunDefs}
        commandTextData={commandTextData}
      />
    )
  }
  // PipetteWizardFlow
  if ('type' in action && action.type === 'pipette_wizard_flow') {
    return <PipetteFlowActionText className={className} action={action} t={t} />
  }
  if ('type' in action && action.type === 'attach_module') {
    return (
      <AttachModuleActionText className={className} action={action} t={t} />
    )
  }
  return <div className={className}>{JSON.stringify(action)}</div>
}
