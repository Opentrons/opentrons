import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  TYPOGRAPHY,
  LegacyStyledText,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import type { Mount } from '/app/redux/pipettes/types'
import type { CalibrationCheckInstrument } from '/app/redux/sessions/types'

interface MountInformationProps {
  mount: Mount
  pipette?: CalibrationCheckInstrument
}

export const RenderMountInformation = ({
  mount,
  pipette,
}: MountInformationProps): JSX.Element => {
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
        <LegacyStyledText as="p">{displayName}</LegacyStyledText>
      ) : (
        <LegacyStyledText
          as="p"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('empty')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
