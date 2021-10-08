import * as React from 'react'
import { ApiClientProvider, ApiHostProvider } from '@opentrons/react-api-client'
import { ReactQueryDevtools } from 'react-query/devtools'

import { TextInput } from './TextInput'
import { Health } from './Health'
import { BasicSession } from './BasicSession'

export function App(): JSX.Element {
  const [hostname, setHostname] = React.useState('localhost')

  return (
    <ApiClientProvider>
      <ApiHostProvider hostname={hostname}>
        <TextInput placeholder={hostname} onChange={setHostname}>
          Set Host
        </TextInput>
        <Health />
        <BasicSession />
      </ApiHostProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </ApiClientProvider>
  )
}
