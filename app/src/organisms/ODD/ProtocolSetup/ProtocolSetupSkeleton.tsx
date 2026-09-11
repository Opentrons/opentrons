import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  SPACING,
} from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

export function ProtocolSetupTitleSkeleton(): JSX.Element {
  return (
    <>
      <Skeleton
        height="2.25rem"
        width="11.937rem"
        backgroundSize="99rem"
        borderRadius={BORDERS.borderRadius12}
      />
      <Skeleton
        height="2.25rem"
        width="28rem"
        backgroundSize="99rem"
        borderRadius={BORDERS.borderRadius12}
      />
    </>
  )
}

export function ProtocolSetupButtonsSkeleton(): JSX.Element {
  return (
    <>
      <Skeleton
        height="6.25rem"
        width="6.25rem"
        backgroundSize="99rem"
        borderRadius={BORDERS.borderRadiusFull}
        fixedBackground
      />
      <Skeleton
        height="6.25rem"
        width="6.25rem"
        backgroundSize="99rem"
        borderRadius={BORDERS.borderRadiusFull}
        fixedBackground
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
      borderRadius={BORDERS.borderRadius12}
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
    </>
  )
}

export function ProtocolSetupFullSkeleton(): JSX.Element {
  return (
    <Flex
      position={POSITION_ABSOLUTE}
      top="0"
      left="0"
      height="100vh"
      width="100vw"
      backgroundColor={COLORS.white}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
            <ProtocolSetupTitleSkeleton />
          </Flex>
          <Flex gridGap={SPACING.spacing16}>
            <ProtocolSetupButtonsSkeleton />
          </Flex>
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
      >
        <ProtocolSetupStepSkeleton />
      </Flex>
    </Flex>
  )
}
