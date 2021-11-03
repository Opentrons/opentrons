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
import _Fixture_commands from './Fixture_commands.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'


export function RunDetailsCommands(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetails()
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  if (protocolData == null) return null
//  const fixtureCommands = _Fixture_commands as Command //TODO: immediately

const LABWARE_LOCATION = { slotName: '9' } || { moduleId: 'thermocycler' } || {
  coordinates: { x: 0, y: 0, z: 0 },
}

const COMMAND = {
commandType: 'loadLabware',
params: {
  labwareId: '96_wellplate',
  location: LABWARE_LOCATION,
},
result: {
  labwareId: '96_wellplate',
  definition: fixture_96_plate as LabwareDefinition2,
  offset: { x: 0, y: 0, z: 0 },
},
} as Command

  return (
    <React.Fragment>
      <Flex margin={SPACING_1}>
        {showProtocolSetupInfo ? (
          <ProtocolSetupInfo
            onCloseClick={() => setShowProtocolSetupInfo(false)}
            SetupCommand={COMMAND}
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
