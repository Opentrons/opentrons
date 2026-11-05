import { useTranslation } from 'react-i18next'

import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { LegacyStyledText } from '@opentrons/components'

import styles from './errorcontent.module.css'

import type { ReactNode } from 'react'
import type { RunStatus } from '@opentrons/api-client'
import type { RunCommandError } from '@opentrons/shared-data'

interface ErrorContentProps {
  errors: RunCommandError[]
  isSingleError: boolean
  runStatus: RunStatus | null
}
export function ErrorContent({
  errors,
  isSingleError,
  runStatus,
}: ErrorContentProps): ReactNode {
  const { t } = useTranslation('run_details')
  return (
    <>
      <LegacyStyledText forwardedAs="p" className={styles.error_info_text}>
        {isSingleError
          ? t('error_info', {
              errorType: errors[0].errorType,
              errorCode: errors[0].errorCode,
            })
          : runStatus === RUN_STATUS_SUCCEEDED
            ? t(errors.length > 1 ? 'no_of_warnings' : 'no_of_warning', {
                count: errors.length,
              })
            : t(errors.length > 1 ? 'no_of_errors' : 'no_of_error', {
                count: errors.length,
              })}
      </LegacyStyledText>
      <div className={styles.error_container}>
        <div className={styles.error_list}>
          {errors.map((error, index) => (
            <LegacyStyledText
              forwardedAs="p"
              className={styles.error_detail_text}
              key={index}
            >
              {isSingleError
                ? error.detail
                : `${error.errorCode}: ${error.detail}`}
            </LegacyStyledText>
          ))}
        </div>
      </div>
    </>
  )
}
