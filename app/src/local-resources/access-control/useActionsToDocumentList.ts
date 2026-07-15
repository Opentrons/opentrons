import { useCallback, useState } from 'react'

import type { DocumentedAction } from '@opentrons/react-api-client'

export const useActionsToDocumentList = (
  initialActions?: DocumentedAction[]
): [DocumentedAction[], (action: DocumentedAction) => void] => {
  const [actionsToDocument, setActionsToDocument] = useState<
    DocumentedAction[]
  >(initialActions ?? [])
  const addActionToDocument = useCallback((action: DocumentedAction) => {
    setActionsToDocument(prev => [...prev, action])
  }, [])
  return [actionsToDocument, addActionToDocument]
}
