import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  LegacyStyledText,
  OVERFLOW_AUTO,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

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
    <Flex flexDirection={DIRECTION_COLUMN}>
      <LegacyStyledText
        forwardedAs="p"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
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
      <Flex css={ERROR_MESSAGE_STYLE}>
        {' '}
        {errors.map((error, index) => (
          <LegacyStyledText
            forwardedAs="p"
            textAlign={TYPOGRAPHY.textAlignLeft}
            key={index}
          >
            {' '}
            {isSingleError
              ? error.detail
              : `${error.errorCode}: ${error.detail}`}
          </LegacyStyledText>
        ))}
      </Flex>
    </Flex>
  )
}

const ERROR_MESSAGE_STYLE = css`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  max-height: 9.5rem;
  overflow-y: ${OVERFLOW_AUTO};
  margin-top: ${SPACING.spacing8};
  margin-bottom: ${SPACING.spacing16};
  padding: ${`${SPACING.spacing8} ${SPACING.spacing12}`};
  background-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};

  ::-webkit-scrollbar-thumb {
    background: ${COLORS.grey40};
  }
`
