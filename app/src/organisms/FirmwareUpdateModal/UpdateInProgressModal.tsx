import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { OddModal } from '/app/molecules/OddModal'
import type { Subsystem } from '@opentrons/api-client'

interface UpdateInProgressModalProps {
  subsystem: Subsystem
}

const SPINNER_STYLE = css`
  color: ${COLORS.grey50};
  opacity: 100%;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    color: ${COLORS.black90};
    opacity: 70%;
  }
`

export function UpdateInProgressModal(
  props: UpdateInProgressModalProps
): JSX.Element {
  const { subsystem } = props
  const { t } = useTranslation('firmware_update')

  return (
    <OddModal>
      <Flex
        height="17.25rem"
        width="100%"
        backgroundColor={COLORS.grey35}
        borderRadius={BORDERS.borderRadius12}
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing32}
        justifyContent={ALIGN_CENTER}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing40}
      >
        <LegacyStyledText
          as="h4"
          marginBottom={SPACING.spacing4}
          fontWeight={TYPOGRAPHY.fontWeightBold}
        >
          {t('updating_firmware', { subsystem: t(subsystem) })}
        </LegacyStyledText>
        <Icon
          name="ot-spinner"
          aria-label="spinner"
          size="6.25rem"
          css={SPINNER_STYLE}
          spin
        />
      </Flex>
    </OddModal>
  )
}
