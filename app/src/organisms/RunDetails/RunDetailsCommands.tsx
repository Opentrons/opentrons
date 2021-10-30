import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Text,
  DIRECTION_COLUMN,
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
import { useProtocolDetails } from './hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'

export function RunDetailsCommands(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetails()
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  if (protocolData == null) return null

  return (
    <React.Fragment>
      <Flex
        margin={SPACING_1}
        backgroundColor={'#FAFAFA'} //  background color should change when this step is completed
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
              color={C_MED_DARK_GRAY}
            >
              <Flex>{t('protocol_setup')}</Flex>
              <Flex>
                <Icon name={'chevron-left'} width={SIZE_1} />
              </Flex>
            </Flex>
          </Btn>
        )}
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN}>
        {'commands' in protocolData
          ? protocolData.commands.map((command, index) => (
              <Flex key={index}>
                <Text>{command.command}</Text>
              </Flex>
            ))
          : null}
      </Flex>
    </React.Fragment>
  )
}
