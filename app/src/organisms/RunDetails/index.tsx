import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  PrimaryBtn,
  BORDER_WIDTH_DEFAULT,
  C_BLUE,
  C_WHITE,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
  Flex,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import fixtureCommands from '@opentrons/app/src/organisms/RunDetails/Fixture_commands.json'
import { useProtocolDetails } from './hooks'
import { CommandList } from './CommandList'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { displayName } = useProtocolDetails()
  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {}, true)
  const [commandIdIndex] = React.useState<number>(0)
  const commandId = fixtureCommands.commands.map(command => command.id)
  const commandStatuses = fixtureCommands.commands.map(
    command => command.status
  )

  const cancelRunButton = (
    <PrimaryBtn
      onClick={confirmExit}
      backgroundColor={C_WHITE}
      color={C_BLUE}
      borderWidth={BORDER_WIDTH_DEFAULT}
      lineHeight={LINE_HEIGHT_SOLID}
      fontWeight={FONT_WEIGHT_SEMIBOLD}
      marginX={SPACING_3}
      paddingRight={SPACING_2}
      paddingLeft={SPACING_2}
    >
      {t('cancel_run')}
    </PrimaryBtn>
  )

  const titleBarProps = {
    title: t('protocol_title', { protocol_name: displayName }),
    rightNode: cancelRunButton,
  }
  return (
    <Page titleBarProps={titleBarProps}>
      {showConfirmExit ? <ConfirmCancelModal onClose={cancelExit} /> : null}

      <Flex key={commandId[commandIdIndex]}>
        <CommandList
          anticipated={commandId[commandIdIndex + 1]}
          inProgress={commandId[commandIdIndex]}
          completed={commandId[commandIdIndex - 1]}
          isFailed={commandStatuses[commandIdIndex] === 'failed'}
        />
      </Flex>
    </Page>
  )
}
