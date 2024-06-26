import * as React from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { Move } from '../../../molecules/InterventionModal/InterventionStep'
import { InlineNotification } from '../../../atoms/InlineNotification'

import type { RecoveryContentProps } from '../types'

type LeftColumnLabwareInfoProps = RecoveryContentProps & {
  title: string
  moveType: React.ComponentProps<typeof Move>['type']
  /* Renders a warning InlineNotification if provided. */
  bannerText?: string
}
// TODO(jh, 06-12-24): EXEC-500 & EXEC-501.
// The left column component adjacent to RecoveryDeckMap/TipSelection.
export function LeftColumnLabwareInfo({
  title,
  failedLabwareUtils,
  isOnDevice,
  moveType,
  bannerText,
}: LeftColumnLabwareInfoProps): JSX.Element | null {
  const { failedLabwareName, failedLabware } = failedLabwareUtils

  const buildLabwareLocationSlotName = (): string => {
    const location = failedLabware?.location
    if (
      location != null &&
      typeof location === 'object' &&
      'slotName' in location
    ) {
      return location.slotName
    } else {
      return ''
    }
  }

  if (isOnDevice) {
    return (
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText as="h4SemiBold">{title}</LegacyStyledText>
          <Move
            type={moveType}
            labwareName={failedLabwareName ?? ''}
            currentLocationProps={{ slotName: buildLabwareLocationSlotName() }}
          />
        </Flex>
        {bannerText != null ? (
          <InlineNotification
            type="alert"
            heading={bannerText}
          ></InlineNotification>
        ) : null}
      </Flex>
    )
  } else {
    return null
  }
}
