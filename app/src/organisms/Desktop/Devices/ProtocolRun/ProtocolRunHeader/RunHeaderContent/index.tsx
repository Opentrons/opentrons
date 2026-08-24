import { RunHeaderSectionLower } from './RunHeaderSectionLower'
import { RunHeaderSectionUpper } from './RunHeaderSectionUpper'

import type { MutableRefObject, ReactNode } from 'react'
import type { AttachedModule, Run, RunStatus } from '@opentrons/api-client'
import type { RunControls } from '/app/organisms/RunTimeControl'
import type { ProtocolRunHeaderProps } from '..'
import type { UseRunHeaderModalContainerResult } from '../RunHeaderModalContainer'

export type RunHeaderContentProps = ProtocolRunHeaderProps & {
  runRecord: Run | null
  runStatus: RunStatus | null
  isResetRunLoadingRef: MutableRefObject<boolean>
  attachedModules: AttachedModule[]
  protocolRunControls: RunControls
  runHeaderModalContainerUtils: UseRunHeaderModalContainerResult
  isClosingCurrentRun: boolean
  robotName: string
  numberOfAtomicCommands: number
}

export function RunHeaderContent(props: RunHeaderContentProps): ReactNode {
  return (
    <>
      <RunHeaderSectionUpper {...props} />
      {props.runStatus != null ? <RunHeaderSectionLower {...props} /> : null}
    </>
  )
}
