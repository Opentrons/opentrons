import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import * as Sessions from '../../redux/sessions'
import { NeedHelpLink } from './NeedHelpLink'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

import type { CalibrationPanelProps } from './types'
import type {
  SessionType,
  SessionCommandString,
} from '../../redux/sessions/types'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
const moveCommandBySessionType: {
  [sessionType in SessionType]: SessionCommandString
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]:
    Sessions.sharedCalCommands.MOVE_TO_DECK,
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]:
    Sessions.sharedCalCommands.MOVE_TO_DECK,
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]:
    Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]:
    Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
}
export function TipConfirmation(props: CalibrationPanelProps): JSX.Element {
  const { sendCommands, sessionType } = props
  const { t } = useTranslation(['robot_calibration', 'shared'])

  const moveCommandString = moveCommandBySessionType[sessionType]

  const invalidateTip = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.INVALIDATE_TIP })
  }
  const confirmTip = (): void => {
    sendCommands({ command: moveCommandString })
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="32rem"
    >
      <StyledText as="h1" marginBottom={SPACING.spacing4}>
        {t('did_pipette_pick_up_tip')}
      </StyledText>

      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing4}
      >
        <NeedHelpLink />
        <Flex gridGap={SPACING.spacing3}>
          <SecondaryButton
            onClick={invalidateTip}
            css={CAPITALIZE_FIRST_LETTER_STYLE}
          >
            {t('shared:try_again')}
          </SecondaryButton>
          <PrimaryButton
            onClick={confirmTip}
            css={CAPITALIZE_FIRST_LETTER_STYLE}
          >
            {t('shared:yes')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
