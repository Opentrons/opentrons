import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import * as Sessions from '../../redux/sessions'
import {
  Flex,
  Link,
  JUSTIFY_CENTER,
  FONT_SIZE_BODY_1,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { ConfirmCrashRecovery } from './ConfirmCrashRecovery'

import type { CalibrationPanelProps } from './types'
import { StyledText } from '../../atoms/text'

export function useConfirmCrashRecovery(
  props: CalibrationPanelProps
): [link: React.ReactNode, confirmation: React.ReactNode] {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands } = props
  const [showModal, setShowModal] = React.useState(false)

  const doStartOver = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.INVALIDATE_LAST_ACTION })
  }
  return [
    <Flex key="crash-recovery-link" justifyContent={JUSTIFY_CENTER} gridGap={SPACING.spacing2}>
      <StyledText as="p" fontSize={FONT_SIZE_BODY_1}>{t('jog_too_far_or_bend_tip')}</StyledText>
      <Link
        onClick={() => setShowModal(true)}
        css={TYPOGRAPHY.linkPSemiBold}>
        {t('start_over')}
      </Link>
    </Flex>,
    showModal ? (
      <ConfirmCrashRecovery
        key="crash-recovery-modal"
        confirm={doStartOver}
        back={() => {
          setShowModal(false)
        }}
      />
    ) : null,
  ]
}
