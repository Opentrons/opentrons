import * as React from 'react'
import { useEnsureBasicSession } from '@opentrons/react-api-client'

export function BasicSession(): JSX.Element | null {
  const basicSession = useEnsureBasicSession()

  return basicSession != null ? (
    <pre>
      <code>{JSON.stringify(basicSession, null, 2)}</code>
    </pre>
  ) : null
}
