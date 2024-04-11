import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Btn,
  Icon,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  TYPOGRAPHY,
  BORDERS,
  OVERFLOW_WRAP_BREAK_WORD,
} from '@opentrons/components'
import styled from 'styled-components'

interface RunPausedSplashProps {
  onClose: () => void
  errorType?: string
  protocolName?: string
}

export function RunPausedSplash({
  onClose,
  errorType,
  protocolName,
}: RunPausedSplashProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  let subText: string | null
  switch (errorType) {
    default:
      subText = protocolName ?? null
  }

  return (
    <Btn
      height="100vh"
      width="100%"
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      position={POSITION_ABSOLUTE}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      padding={SPACING.spacing40}
      backgroundColor={COLORS.grey50}
      onClick={onClose}
    >
      <SplashFrame>
        <Flex gridGap={SPACING.spacing32} alignItems={ALIGN_CENTER}>
          <Icon name={'ot-alert'} size="4.5rem" color={COLORS.white} />
          <SplashHeader>{t('run_paused')}</SplashHeader>
        </Flex>
        <Flex width="49rem" justifyContent={JUSTIFY_CENTER}>
          <SplashBody>{subText}</SplashBody>
        </Flex>
      </SplashFrame>
    </Btn>
  )
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: 80px;
  line-height: 94px;
  color: ${COLORS.white};
`
const SplashBody = styled.h4`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
  color: ${COLORS.white};
`

const SplashFrame = styled(Flex)`
  width: 100%;
  height: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing40};
  border-radius: ${BORDERS.borderRadius8};
`
