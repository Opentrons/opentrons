import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectors as robotSelectors } from '../../../redux/robot'
import { getProtocolFilename, openProtocol } from '../../../redux/protocol'

import { SidePanel } from '@opentrons/components'
import { Upload } from './Upload'

import type { State, Dispatch } from '../../../redux/types'
import { useFeatureFlag } from '../../../redux/config'

export function UploadPanel(): JSX.Element | null {
  const isUploadWithoutRPC = useFeatureFlag('preProtocolFlowWithoutRPC')
  const dispatch = useDispatch<Dispatch>()
  const filename = useSelector((state: State) => getProtocolFilename(state))
  const sessionLoaded = useSelector((state: State) =>
    robotSelectors.getSessionIsLoaded(state)
  )

  const createSession = (file: File): void => {
    dispatch(openProtocol(file))
  }
  if (Boolean(isUploadWithoutRPC)) return null
  return (
    <SidePanel title="Protocol File">
      <Upload {...{ filename, sessionLoaded, createSession }} />
    </SidePanel>
  )
}
