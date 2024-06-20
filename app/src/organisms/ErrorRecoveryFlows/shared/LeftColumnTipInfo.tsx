import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { Move } from '../../../molecules/InterventionModal/InterventionStep'
import { InlineNotification } from '../../../atoms/InlineNotification'

import type { RecoveryContentProps } from '../types'

type LeftColumnTipInfoProps = RecoveryContentProps & {
  title: string
}
// TODO(jh, 06-12-24): EXEC-500 & EXEC-501.
// The left column component adjacent to RecoveryDeckMap/TipSelection.
export function LeftColumnTipInfo({
  title,
  failedLabwareUtils,
  isOnDevice,
}: LeftColumnTipInfoProps): JSX.Element | null {
  const { pickUpTipLabwareName, pickUpTipLabware } = failedLabwareUtils
  const { t } = useTranslation('error_recovery')

  const buildLabwareLocationSlotName = (): string => {
    const location = pickUpTipLabware?.location
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
          <StyledText as="h4SemiBold">{title}</StyledText>
          <Move
            type={'refill'}
            labwareName={pickUpTipLabwareName ?? ''}
            currentLocationProps={{ slotName: buildLabwareLocationSlotName() }}
          />
        </Flex>
        <InlineNotification
          type="alert"
          heading={t('replace_tips_and_select_location')}
        ></InlineNotification>
      </Flex>
    )
  } else {
    return null
  }
}
