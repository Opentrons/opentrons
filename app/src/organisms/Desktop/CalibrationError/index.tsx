import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'

import {
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_CENTER,
  COLORS,
  Icon,
  Flex,
  StyledText,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  TEXT_ALIGN_CENTER,
  AlertPrimaryButton,
} from '@opentrons/components'

import { dismissAllRequests, getRequests } from '/app/redux/robot-api'

import type { State } from '/app/redux/types'

export interface CalibrationErrorInfo {
  title: string
  subText: string
}

export type UseCalibrationErrorInfoResult = CalibrationErrorInfo | null

// Returns relevant copy derived from the error response, if any.
export function useCalibrationError(
  requestIds: string[],
  sessionId: string | undefined
): UseCalibrationErrorInfoResult {
  const { t } = useTranslation(['robot_calibration', 'branded'])
  const dispatch = useDispatch()

  // Dismiss all network requests during a unique session to prevent stale error state.
  useEffect(() => {
    if (sessionId != null) {
      dispatch(dismissAllRequests())
    }
  }, [sessionId])

  const reqs = useSelector((state: State) => {
    return getRequests(state, requestIds)
  })
  const erroredReqs = reqs.filter(req => req?.status === 'failure')

  if (erroredReqs.length > 0) {
    const erroredReq = erroredReqs[0]
    if (erroredReq != null && erroredReq.status === 'failure') {
      if ('errors' in erroredReq.error) {
        const title =
          erroredReq.error.errors[0].title ??
          (t('robot_calibration:error') as string)
        const subText =
          erroredReq.error.errors[0].detail ??
          (t('branded:unexpected_error') as string)

        return { title, subText }
      } else if ('message' in erroredReq.error) {
        const title = t('robot_calibration:error')
        const subText =
          erroredReq.error.message ?? (t('branded:unexpected_error') as string)

        return { title, subText }
      } else {
        return {
          title: t('robot_calibration:error'),
          subText: t('branded:unexpected_error'),
        }
      }
    }
  }

  return null
}

export type CalibrationErrorProps = CalibrationErrorInfo & {
  onClose: () => void
}

export function CalibrationError({
  subText,
  title,
  onClose,
}: CalibrationErrorProps): JSX.Element {
  const [isClosing, setIsClosing] = useState(false)
  const { t } = useTranslation('robot_calibration')

  return (
    <Flex css={CONTAINER_STYLE}>
      <Flex css={CONTENT_CONTAINER_STYLE}>
        <Icon name="alert-circle" css={ICON_STYLE} color={COLORS.red50} />
        <StyledText oddStyle="level3HeaderBold" desktopStyle="headingSmallBold">
          {title}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          oddStyle="level4HeaderRegular"
        >
          {subText}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <AlertPrimaryButton
          onClick={() => {
            setIsClosing(true)
            onClose()
          }}
          disabled={isClosing}
        >
          {t('exit')}
        </AlertPrimaryButton>
      </Flex>
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  padding: ${SPACING.spacing32};
`

const CONTENT_CONTAINER_STYLE = css`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  padding: ${SPACING.spacing40} ${SPACING.spacing16};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  text-align: ${TEXT_ALIGN_CENTER};
  margin-top: ${SPACING.spacing16};
`

const ICON_STYLE = css`
  width: 40px;
  height: 40px;
`
