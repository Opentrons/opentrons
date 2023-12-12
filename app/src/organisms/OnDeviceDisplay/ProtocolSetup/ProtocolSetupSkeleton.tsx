import * as React from 'react'

import { BORDERS } from '@opentrons/components'

import { Skeleton } from '../../../atoms/Skeleton'

export function ProtocolSetupTitleSkeleton(): JSX.Element {
  return (
    <>
      <Skeleton
        height="2.25rem"
        width="11.937rem"
        backgroundSize="99rem"
        borderRadius={BORDERS.borderRadiusSize3}
      />
      <Skeleton
        height="2.25rem"
        width="28rem"
        backgroundSize="99rem"
        borderRadius={BORDERS.borderRadiusSize3}
      />
    </>
  )
}

const SetupSkeleton = (): JSX.Element => {
  return (
    <Skeleton
      height="5.5rem"
      width="100%"
      backgroundSize="99rem"
      borderRadius={BORDERS.borderRadiusSize3}
    />
  )
}

export function ProtocolSetupStepSkeleton(): JSX.Element {
  return (
    <>
      <SetupSkeleton />
      <SetupSkeleton />
      <SetupSkeleton />
      <SetupSkeleton />
      <SetupSkeleton />
    </>
  )
}
