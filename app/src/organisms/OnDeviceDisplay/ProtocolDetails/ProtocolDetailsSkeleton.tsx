import * as React from 'react'

import { Flex, BORDERS, DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import { Skeleton } from '../../../atoms/Skeleton'

export function ProtocolDetailsHeaderChipSkeleton(): JSX.Element {
  return (
    <Skeleton
      width="12.17875rem"
      height="2.75rem"
      backgroundSize="99rem"
      borderRadius={BORDERS.borderRadiusSize3}
    />
  )
}

export function ProcotolDetailsHeaderTitleSkeleton(): JSX.Element {
  return (
    <Skeleton
      width="42rem"
      height="3rem"
      backgroundSize="99rem"
      borderRadius={BORDERS.borderRadiusSize3}
    />
  )
}

export function ProtocolDetailsSectionContentSkeleton(): JSX.Element {
  return (
    <Flex margin={SPACING.spacing16}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <Skeleton
          width="12rem"
          height="1.75rem"
          backgroundSize="99rem"
          borderRadius={BORDERS.borderRadiusSize5}
        />
        <Skeleton
          width="58rem"
          height="1.75rem"
          backgroundSize="99rem"
          borderRadius={BORDERS.borderRadiusSize5}
        />
        <Skeleton
          width="58rem"
          height="1.75rem"
          backgroundSize="99rem"
          borderRadius={BORDERS.borderRadiusSize5}
        />
        <Skeleton
          width="39rem"
          height="1.75rem"
          backgroundSize="99rem"
          borderRadius={BORDERS.borderRadiusSize5}
        />
        <Flex
          borderRadius={BORDERS.borderRadiusSize1}
          marginTop={SPACING.spacing24}
          width="max-content"
        >
          <Skeleton
            width="18rem"
            height="2.25rem"
            backgroundSize="99rem"
            borderRadius={BORDERS.borderRadiusSize3}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
