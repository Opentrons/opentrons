import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import * as Sessions from '/app/redux/sessions'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'

import type { CalibrationPanelProps } from './types'
import type {
  SessionType,
  SessionCommandString,
} from '/app/redux/sessions/types'

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
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <LegacyStyledText as="h1" marginBottom={SPACING.spacing16}>
        {t('did_pipette_pick_up_tip')}
      </LegacyStyledText>

      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing16}
      >
        <NeedHelpLink />
        <Flex gridGap={SPACING.spacing8}>
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
