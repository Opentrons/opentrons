import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ProgressBar } from '../../atoms/ProgressBar'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'
import { Subsystem } from '@opentrons/api-client'

interface UpdateInProgressModalProps {
  percentComplete: number
  subsystem: Subsystem
}

const OUTER_STYLES = css`
  background: ${COLORS.grey30};
  width: 100%;
`

export function UpdateInProgressModal(
  props: UpdateInProgressModalProps
): JSX.Element {
  const { percentComplete, subsystem } = props
  const { t } = useTranslation('firmware_update')

  return (
    <Modal>
      <Flex
        height="17.25rem"
        width="100%"
        backgroundColor={COLORS.grey35}
        borderRadius={BORDERS.borderRadiusSize3}
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing32}
        justifyContent={ALIGN_CENTER}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing40}
      >
        <StyledText
          as="h4"
          marginBottom={SPACING.spacing4}
          fontWeight={TYPOGRAPHY.fontWeightBold}
        >
          {t('updating_firmware', { subsystem: t(subsystem) })}
        </StyledText>
        <ProgressBar
          percentComplete={percentComplete}
          outerStyles={OUTER_STYLES}
        />
      </Flex>
    </Modal>
  )
}
