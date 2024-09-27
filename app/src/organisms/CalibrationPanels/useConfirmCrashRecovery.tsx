import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  JUSTIFY_CENTER,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import * as Sessions from '/app/redux/sessions'
import { ConfirmCrashRecovery } from './ConfirmCrashRecovery'

import type { CalibrationPanelProps } from './types'

export function useConfirmCrashRecovery(
  props: CalibrationPanelProps
): [link: JSX.Element, confirmation: JSX.Element | null] {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands } = props
  const [showModal, setShowModal] = useState(false)

  const doStartOver = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.INVALIDATE_LAST_ACTION })
  }
  return [
    <Flex
      key="crash-recovery-link"
      justifyContent={JUSTIFY_CENTER}
      gridGap={SPACING.spacing4}
    >
      <LegacyStyledText as="p">{t('jog_too_far_or_bend_tip')}</LegacyStyledText>
      <Link
        role="button"
        onClick={() => {
          setShowModal(true)
        }}
        css={TYPOGRAPHY.linkPSemiBold}
      >
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
