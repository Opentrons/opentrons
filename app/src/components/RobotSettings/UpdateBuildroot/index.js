// @flow
import * as React from 'react'
import SystemUpdateModal from './SystemUpdateModal'
import type { BuildrootStatus } from '../../../discovery'

type Props = {
  parentUrl: string,
  buildrootStatus: BuildrootStatus | null,
  ignoreBuildrootUpdate: () => mixed,
}
export default function UpdateBuildroot(props: Props) {
  const { buildrootStatus, parentUrl, ignoreBuildrootUpdate } = props
  if (buildrootStatus === 'balena') {
    return (
      <SystemUpdateModal
        ignoreUpdate={ignoreBuildrootUpdate}
        parentUrl={parentUrl}
      />
    )
  }
  return null
}
