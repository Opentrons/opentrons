import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
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
import { ProtocolFile } from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'

interface Props {
  anticipated: Command[]
  inProgress: Command
  completed: Command[]
}
export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  //  @ts-expect-error casting a v6 protocol, remove when wiring up to protocol resource
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  if (protocolData == null) return null

  // const COMMAND = {
  //   commandType: 'loadLabware',
  //   params: {
  //     labwareId: '96_wellplate',
  //     location: { slotName: '9' } || {
  //         moduleId: 'thermocycler',
  //       } || {
  //         coordinates: { x: 0, y: 0, z: 0 },
  //       },
  //   },
  //   result: {
  //     labwareId: '96_wellplate',
  //     definition: fixture_96_plate as LabwareDefinition2,
  //     offset: { x: 0, y: 0, z: 0 },
  //   },
  // } as Command

  return (
    <React.Fragment>
      <Flex margin={SPACING_1}>
        {showProtocolSetupInfo ? (
          protocolData.commands.map(command => (
            <Flex id={`RunDetails_ProtocolSetup_CommandList`} key={command.id}>
              <ProtocolSetupInfo
                onCloseClick={() => setShowProtocolSetupInfo(false)}
                SetupCommand={
                  command.commandType === 'loadLabware' ||
                  'loadPipette' ||
                  'loadModule'
                    ? command
                    : undefined
                }
              />
            </Flex>
          ))
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
      <Flex
        flexDirection={DIRECTION_COLUMN}
        fontSize={FONT_SIZE_CAPTION}
        color={C_MED_DARK_GRAY}
      >
        <Flex>
          {'commands' in protocolData
            ? protocolData.commands.map(command => {
                command.commandType === 'delay' ? (
                  <Flex flexDirection={DIRECTION_ROW}>
                    <Flex
                      textTransform={TEXT_TRANSFORM_UPPERCASE}
                      padding={SPACING_1}
                      key={command.id}
                      id={`RunDetails_CommandList`}
                    >
                      {t('comment')}
                    </Flex>
                    <Flex>{command.params.message}</Flex>
                  </Flex>
                ) : (
                  command.commandType !== 'loadLabware' &&
                  'loadPipette' &&
                  'loadModule' && (
                    <Flex key={command.id}>{command.commandType}</Flex>
                  )
                )
              })
            : null}
        </Flex>
        <Flex padding={SPACING_1}>{t('end_of_protocol')}</Flex>
      </Flex>
    </React.Fragment>
  )
}
