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

interface UpdateInProgressModalProps {
  percentComplete: number
}

const OUTER_STYLES = css`
  background: ${COLORS.medGreyEnabled};
  width: 100%;
`

export function UpdateInProgressModal(
  props: UpdateInProgressModalProps
): JSX.Element {
  const { percentComplete } = props
  const { i18n, t } = useTranslation('firmware_update')

  return (
    <Modal>
      <Flex
        height="17.25rem"
        width="100%"
        backgroundColor={COLORS.darkBlack20}
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
          {i18n.format(t('updating_firmware'), 'capitalize')}
        </StyledText>
        <ProgressBar
          percentComplete={percentComplete}
          outerStyles={OUTER_STYLES}
        />
      </Flex>
    </Modal>
  )
}
