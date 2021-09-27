import * as React from 'react'
import { Page } from '../../atoms/Page'
import { SessionHeader } from '../../organisms/SessionHeader'
import { RunDetails } from '../../organisms/RunDetails'
import { useFeatureFlag } from '../../redux/config'
import { RunLog } from './RunLog'

export function Run(): JSX.Element {
  const isNewProtocolRunPage = useFeatureFlag('preProtocolFlowWithoutRPC')

  return isNewProtocolRunPage
    ? (
      <RunDetails />
    ) : (
      <Page titleBarProps={{ title: <SessionHeader /> }}>
        <RunLog />
      </Page>
    )
}
