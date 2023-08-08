import * as React from 'react'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  OVERFLOW_AUTO,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { LegacyModal } from '../../../molecules/LegacyModal'
import { useDownloadRunLog } from '../hooks'

import type { RunError } from '@opentrons/api-client'
import type { LegacyModalProps } from '../../../molecules/LegacyModal'

/**
 * This modal is for Desktop app
 * @param robotName - Robot name
 * @param runId - Run protocol id
 * @param setShowRunFailedModal - For closing modal
 * @param highestPriorityError - Run error information
 *
 * @returns JSX.Element | null
 */
// Note(kk:08/07/2023)
// This modal and run failed modal for Touchscreen app will be merged into one component like EstopModals.

interface RunFailedModalProps {
  robotName: string
  runId: string
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  highestPriorityError?: RunError
}

export function RunFailedModal({
  robotName,
  runId,
  setShowRunFailedModal,
  highestPriorityError,
}: RunFailedModalProps): JSX.Element | null {
  const { i18n, t } = useTranslation(['run_details', 'shared'])
  const modalProps: LegacyModalProps = {
    type: 'error',
    title: t('run_failed_modal_title'),
    onClose: () => setShowRunFailedModal(false),
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '31.25rem',
  }
  const { downloadRunLog } = useDownloadRunLog(robotName, runId)

  if (highestPriorityError == null) return null

  const handleClick = (): void => {
    setShowRunFailedModal(false)
  }

  const handleDownloadClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
  }

  return (
    <LegacyModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('error_info', {
            errorType: highestPriorityError.errorType,
            errorCode: highestPriorityError.errorCode,
          })}
        </StyledText>
        <Flex
          maxHeight="9.5rem"
          overflowY={OVERFLOW_AUTO}
          marginTop={SPACING.spacing8}
          marginBottom={SPACING.spacing16}
          padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
          backgroundColor={COLORS.fundamentalsBackground}
          borderRadius={BORDERS.borderRadiusSize1}
          overflowWrap="anywhere"
          border={BORDERS.lineBorder}
        >
          <StyledText as="p" textAlign={TYPOGRAPHY.textAlignLeft}>
            {highestPriorityError.detail}
          </StyledText>
          {!isEmpty(highestPriorityError.errorInfo) && (
            <StyledText as="p" textAlign={TYPOGRAPHY.textAlignLeft}>
              {JSON.stringify(highestPriorityError.errorInfo)}
            </StyledText>
          )}
        </Flex>
        <StyledText as="p">
          {t('run_failed_modal_description_desktop')}
        </StyledText>
        <Flex
          marginTop={SPACING.spacing32}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <Link css={TYPOGRAPHY.linkPSemiBold} onClick={handleDownloadClick}>
            <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
              <Icon name="download" size="1rem" />
              {i18n.format(t('download_run_log'), 'titleCase')}
            </Flex>
          </Link>
          <PrimaryButton onClick={handleClick}>
            {i18n.format(t('shared:close'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
