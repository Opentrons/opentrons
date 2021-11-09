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
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { useProtocolDetails } from './hooks'
import { CommandList } from './CommandList'
import fixtureCommands from '@opentrons/app/src/organisms/RunDetails/Fixture_commands.json'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { displayName } = useProtocolDetails()
  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {}, true)
  const [commandIdIndex] = React.useState<number>(0)

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
      {fixtureCommands.commands.map(command => (
        <CommandList
          anticipated={command.id}
          inProgress={command.id[commandIdIndex]}
          completed={command.id[commandIdIndex - 1]}
        />
      ))}
    </Page>
  )
}
