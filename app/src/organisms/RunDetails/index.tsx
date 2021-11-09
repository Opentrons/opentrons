import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  PrimaryBtn,
  Text,
  BORDER_WIDTH_DEFAULT,
  C_ERROR_DARK,
  C_WHITE,
  DIRECTION_COLUMN,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { useProtocolDetails } from './hooks'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { useCancelRun } from '../../pages/Run/RunLog/hooks'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { displayName, protocolData } = useProtocolDetails()
  const runStatus = useRunStatus()
  const { usePause } = useCancelRun()

  const StartCancelRun = (): void => {
    usePause()
    confirmExit()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(StartCancelRun, true)
  if (protocolData == null) return null

  const cancelRunButton = (
    <PrimaryBtn
      onClick={StartCancelRun}
      backgroundColor={C_WHITE}
      color={C_ERROR_DARK}
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

  const titleBarProps =
    runStatus === 'running'
      ? {
          title: t('protocol_title', { protocol_name: displayName }),
          rightNode: cancelRunButton,
        }
      : {
          title: t('protocol_title', { protocol_name: displayName }),
        }

  return (
    <Page titleBarProps={titleBarProps}>
      {showConfirmExit ? <ConfirmCancelModal onClose={cancelExit} /> : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        {'commands' in protocolData
          ? protocolData.commands.map((command, index) => (
              <Flex key={index}>
                <Text>{command.commandType}</Text>
              </Flex>
            ))
          : null}
      </Flex>
    </Page>
  )
}
