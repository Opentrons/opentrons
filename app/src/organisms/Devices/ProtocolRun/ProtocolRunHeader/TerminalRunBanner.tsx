import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  Flex,
  StyledText,
  Link,
} from '@opentrons/components'
import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'

import { Banner } from '../../../../atoms/Banner'
import { useCloseCurrentRun } from '../../../ProtocolUpload/hooks'

import type {
  RunStatus,
  RunCommandErrors,
  RunError,
} from '@opentrons/api-client'

interface TerminalRunProps {
  runStatus: RunStatus | null
  toggleRunFailedModal: () => void
  commandErrorList?: RunCommandErrors
  isResetRunLoading: boolean
  isRunCurrent: boolean
  cancelledWithoutRecovery: boolean
  highestPriorityError?: RunError | null
}

// TODO(jh 04-24-2024): Split TerminalRunBanner into a RunSuccessBanner and RunFailedBanner.
export function TerminalRunBanner(props: TerminalRunProps): JSX.Element | null {
  const {
    runStatus,
    toggleRunFailedModal,
    commandErrorList,
    highestPriorityError,
    isResetRunLoading,
    isRunCurrent,
    cancelledWithoutRecovery,
  } = props
  const { t } = useTranslation('run_details')
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()

  const completedWithErrors =
    commandErrorList?.data != null && commandErrorList.data.length > 0

  const handleRunSuccessClick = (): void => {
    closeCurrentRun()
  }

  const handleFailedRunClick = (): void => {
    // TODO(jh, 08-15-24): Revisit the control flow here here after commandErrorList may be fetched for a non-current run.
    if (commandErrorList == null) {
      closeCurrentRun()
    }
    toggleRunFailedModal()
  }

  const buildSuccessBanner = (): JSX.Element => {
    return (
      <Banner
        type="success"
        onCloseClick={handleRunSuccessClick}
        isCloseActionLoading={isClosingCurrentRun}
        iconMarginLeft={SPACING.spacing4}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
          {t('run_completed')}
        </Flex>
      </Banner>
    )
  }

  const buildErrorBanner = (): JSX.Element => {
    return (
      <Banner
        type={runStatus === RUN_STATUS_SUCCEEDED ? 'warning' : 'error'}
        iconMarginLeft={SPACING.spacing4}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
          <StyledText desktopStyle="bodyDefaultRegular">
            {highestPriorityError != null
              ? t('error_info', {
                  errorType: highestPriorityError?.errorType,
                  errorCode: highestPriorityError?.errorCode,
                })
              : `${
                  runStatus === RUN_STATUS_SUCCEEDED
                    ? t('run_completed_with_warnings')
                    : t('run_canceled_with_errors')
                }`}
          </StyledText>

          <Link
            onClick={handleFailedRunClick}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {runStatus === RUN_STATUS_SUCCEEDED
              ? t('view_warning_details')
              : t('view_error_details')}
          </Link>
        </Flex>
      </Banner>
    )
  }

  if (
    runStatus === RUN_STATUS_SUCCEEDED &&
    isRunCurrent &&
    !isResetRunLoading &&
    !completedWithErrors
  ) {
    return buildSuccessBanner()
  }
  // TODO(jh, 08-14-24): Ideally, the backend never returns the "user cancelled a run" error and cancelledWithoutRecovery becomes unnecessary.
  else if (
    !cancelledWithoutRecovery &&
    !isResetRunLoading &&
    (highestPriorityError != null || completedWithErrors)
  ) {
    return buildErrorBanner()
  } else {
    return null
  }
}
