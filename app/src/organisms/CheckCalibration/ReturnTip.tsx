import * as React from 'react'
import {
  Flex,
  PrimaryButton,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  ALIGN_STRETCH,
} from '@opentrons/components'
import uniq from 'lodash/uniq'

import * as Sessions from '../../redux/sessions'
import { StyledText } from '../../atoms/text'
import type { CalibrationPanelProps } from '../../organisms/CalibrationPanels/types'
import type { SessionCommandString } from '../../redux/sessions/types'
import { useTranslation } from 'react-i18next'
import { NeedHelpLink } from '../CalibrationPanels'

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
      padding={SPACING.spacing6}
      minHeight="32rem"
    >
      <Flex alignSelf={ALIGN_STRETCH}>
        <StyledText as="h1">
          {onFinalPipette
            ? t('return_tip_and_exit')
            : t('return_tip_and_continue')}
        </StyledText>
      </Flex>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing4}
      >
        <NeedHelpLink />
        <PrimaryButton aria-label="return tip" onClick={confirmReturnTip}>
          {t('return_tip')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
