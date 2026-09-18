import { useCallback } from 'react'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import type { AttachedModule } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type { IdentifyColor } from '@opentrons/shared-data'
import type { SendIdentifyModule } from './types'

export function useSendIdentifyModule(
  documentationState?: DocumentationState,
  actionsToDocument?: DocumentedAction[],
  addActionToDocument?: (action: DocumentedAction) => void
): SendIdentifyModule {
  const newDocState = useDocumentationState()
  const { createLiveCommand } = useCreateLiveCommandMutation(
    documentationState ?? newDocState,
    actionsToDocument,
    addActionToDocument
  )

  const sendIdentifyModule = useCallback(
    (
      module: AttachedModule,
      start: boolean,
      color: IdentifyColor | null = null
    ) => {
      createLiveCommand({
        command: {
          commandType: 'identifyModule',
          params: {
            model: module.moduleModel,
            moduleId: module.id,
            start,
            ...(color != null ? { color } : {}),
          },
        },
      }).catch(error => {
        console.log(error.message)
      })
    },
    [createLiveCommand]
  )
  return sendIdentifyModule
}
