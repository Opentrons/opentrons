import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type { Mount } from '@opentrons/api-client'
import type { CalibrationCheckInstrument } from '/app/redux/sessions/types'

interface MountInformationProps {
  mount: Mount
  pipette?: CalibrationCheckInstrument
}

export const RenderMountInformation = ({
  mount,
  pipette,
}: MountInformationProps): ReactNode => {
  const { t } = useTranslation('shared')
  const displayName =
    (pipette?.model != null &&
      getPipetteModelSpecs(pipette?.model)?.displayName) ||
    pipette?.model
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <LegacyStyledText
        css={TYPOGRAPHY.h6SemiBold}
        color={COLORS.grey50}
        textTransform={TYPOGRAPHY.textTransformUppercase}
      >{`${mount} MOUNT`}</LegacyStyledText>
      {pipette != null ? (
        <LegacyStyledText forwardedAs="p">{displayName}</LegacyStyledText>
      ) : (
        <LegacyStyledText
          forwardedAs="p"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('empty')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
