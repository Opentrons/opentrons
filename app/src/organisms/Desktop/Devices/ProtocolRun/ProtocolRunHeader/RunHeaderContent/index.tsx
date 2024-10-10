import type * as React from 'react'

import { RunHeaderSectionUpper } from './RunHeaderSectionUpper'
import { RunHeaderSectionLower } from './RunHeaderSectionLower'

import type { ProtocolRunHeaderProps } from '..'
import type { AttachedModule, RunStatus } from '@opentrons/api-client'
import type { RunControls } from '/app/organisms/RunTimeControl'
import type { UseRunHeaderModalContainerResult } from '../RunHeaderModalContainer'

export type RunHeaderContentProps = ProtocolRunHeaderProps & {
  runStatus: RunStatus | null
  isResetRunLoadingRef: React.MutableRefObject<boolean>
  attachedModules: AttachedModule[]
  protocolRunControls: RunControls
  runHeaderModalContainerUtils: UseRunHeaderModalContainerResult
}

export function RunHeaderContent(props: RunHeaderContentProps): JSX.Element {
  return (
    <>
      <RunHeaderSectionUpper {...props} />
      {props.runStatus != null ? <RunHeaderSectionLower {...props} /> : null}
    </>
  )
}
