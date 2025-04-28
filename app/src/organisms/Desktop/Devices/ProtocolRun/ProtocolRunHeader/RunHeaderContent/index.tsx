import type { AttachedModule, RunStatus } from '@opentrons/api-client'
import type { RunControls } from '/app/organisms/RunTimeControl'
import type { MutableRefObject } from 'react'
import type { ProtocolRunHeaderProps } from '..'
import type { UseRunHeaderModalContainerResult } from '../RunHeaderModalContainer'
import { RunHeaderSectionLower } from './RunHeaderSectionLower'
import { RunHeaderSectionUpper } from './RunHeaderSectionUpper'

export type RunHeaderContentProps = ProtocolRunHeaderProps & {
  runStatus: RunStatus | null
  isResetRunLoadingRef: MutableRefObject<boolean>
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
