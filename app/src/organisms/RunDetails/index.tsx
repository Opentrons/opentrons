import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  PrimaryBtn,
  Text,
  BORDER_WIDTH_DEFAULT,
  C_BLUE,
  C_WHITE,
  DIRECTION_COLUMN,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_SOLID,
  SPACING_2,
  SPACING_3,
  useConditionalConfirm,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_SIZE_CAPTION,
  SPACING_1,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  DIRECTION_ROW,
  SIZE_1,
  C_MED_DARK_GRAY,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { ConfirmCancelModal } from '../../pages/Run/RunLog'
import { useProtocolDetails } from './hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { displayName, protocolData } = useProtocolDetails()
  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {}, true)
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  if (protocolData == null) return null

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
      <Flex
        margin={SPACING_1}
        backgroundColor={'#FAFAFA'} //  TODO: immediately use C_AQUAMARINE from colors.ts after rebasing!
      >
        {showProtocolSetupInfo ? (
          <ProtocolSetupInfo
            onCloseClick={() => setShowProtocolSetupInfo(false)}
          />
        ) : (
          <Btn
            width={'100%'}
            role={'link'}
            onClick={() => setShowProtocolSetupInfo(true)}
            margin={SPACING_1}
          >
            <Flex
              fontSize={FONT_SIZE_CAPTION}
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
            >
              <Flex>{t('protocol_setup')}</Flex>
              <Flex>
                <Icon
                  name={'chevron-left'}
                  width={SIZE_1}
                  color={C_MED_DARK_GRAY}
                />
              </Flex>
            </Flex>
          </Btn>
        )}
      </Flex>
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
