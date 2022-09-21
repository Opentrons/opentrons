import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Link,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import { StyledText } from '../../atoms/text'
import { ConfirmCrashRecovery } from './ConfirmCrashRecovery'

import type { CalibrationPanelProps } from './types'

export function useConfirmCrashRecovery(
  props: CalibrationPanelProps
): [link: JSX.Element, confirmation: JSX.Element | null] {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands } = props
  const [showModal, setShowModal] = React.useState(false)

  const doStartOver = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.INVALIDATE_LAST_ACTION })
  }
  return [
    <Flex
      key="crash-recovery-link"
      justifyContent={JUSTIFY_CENTER}
      gridGap={SPACING.spacing2}
    >
      <StyledText as="p">{t('jog_too_far_or_bend_tip')}</StyledText>
      <Link
        role="button"
        onClick={() => setShowModal(true)}
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
