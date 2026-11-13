import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { useSentryReport } from '/app/App/hooks/useSentryReport'
import { MediumButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { appRestart, sendLog } from '/app/redux/shell'

import type { ReactNode } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'
import type { Dispatch } from '/app/redux/types'

export function OnDeviceDisplayAppFallback({
  error,
}: FallbackProps): ReactNode {
  const { t } = useTranslation(['app_settings', 'branded'])
  const dispatch = useDispatch<Dispatch>()
  const handleRestartClick = (): void => {
    dispatch(appRestart(error.message as string))
  }
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('error_boundary_title'),
    iconName: 'ot-alert',
    iconColor: COLORS.red50,
  }

  useSentryReport(error)

  // immediately report to robot logs that something fatal happened
  useEffect(
    () => {
      dispatch(sendLog(`ODD app encountered a fatal error: ${error.message}`))
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <OddModal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <LegacyStyledText forwardedAs="p">
          {t('branded:error_boundary_description')}
        </LegacyStyledText>
        <MediumButton
          width="100%"
          buttonType="alert"
          buttonText={t('restart_touchscreen')}
          onClick={handleRestartClick}
        />
      </Flex>
    </OddModal>
  )
}
