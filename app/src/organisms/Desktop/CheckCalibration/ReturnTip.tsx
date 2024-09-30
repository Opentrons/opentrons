import {
  ALIGN_STRETCH,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import uniq from 'lodash/uniq'

import * as Sessions from '/app/redux/sessions'
import type { CalibrationPanelProps } from '/app/organisms/Desktop/CalibrationPanels/types'
import type { SessionCommandString } from '/app/redux/sessions/types'
import { useTranslation } from 'react-i18next'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'

export function ReturnTip(props: CalibrationPanelProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands, checkBothPipettes, activePipette, instruments } = props
  const onFinalPipette =
    !checkBothPipettes ||
    activePipette?.rank === Sessions.CHECK_PIPETTE_RANK_SECOND
  let commandsList: Array<{ command: SessionCommandString }> = [
    { command: Sessions.checkCommands.RETURN_TIP },
  ]
  if (onFinalPipette) {
    commandsList = [
      ...commandsList,
      { command: Sessions.checkCommands.TRANSITION },
    ]
  } else {
    commandsList = [
      ...commandsList,
      { command: Sessions.checkCommands.CHECK_SWITCH_PIPETTE },
    ]
    if (
      instruments &&
      uniq(instruments.map(i => i.tipRackLoadName)).length === 1
    ) {
      // if second pipette has same tip rack as first skip deck setup
      commandsList = [
        ...commandsList,
        { command: Sessions.checkCommands.MOVE_TO_REFERENCE_POINT },
      ]
    }
  }

  const confirmReturnTip = (): void => {
    sendCommands(...commandsList)
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="32rem"
    >
      <Flex alignSelf={ALIGN_STRETCH}>
        <LegacyStyledText as="h1">
          {onFinalPipette
            ? t('return_tip_and_exit')
            : t('return_tip_and_continue')}
        </LegacyStyledText>
      </Flex>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing16}
      >
        <NeedHelpLink />
        <PrimaryButton aria-label="return tip" onClick={confirmReturnTip}>
          {t('return_tip')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
