import { useCallback, useState } from 'react'

import type { DocumentedAction } from '@opentrons/react-api-client'

export const useActionsToDocumentList = (): [
  DocumentedAction[],
  (action: DocumentedAction) => void,
] => {
  const [actionsToDocument, setActionsToDocument] = useState<
    DocumentedAction[]
  >([])
  const addActionToDocument = useCallback((action: DocumentedAction) => {
    setActionsToDocument(prev => [...prev, action])
  }, [])
  return [actionsToDocument, addActionToDocument]
}
