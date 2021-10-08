import * as React from 'react'
import { useHealth } from '@opentrons/react-api-client'

export function Health(): JSX.Element | null {
  const health = useHealth()

  return health != null ? (
    <pre>
      <code>{JSON.stringify(health, null, 2)}</code>
    </pre>
  ) : null
}
