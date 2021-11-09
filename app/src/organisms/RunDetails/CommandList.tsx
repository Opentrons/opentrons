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
import { useRunStatus } from '../RunTimeControl/hooks'
import fixtureCommands from '@opentrons/app/src/organisms/RunDetails/Fixture_commands.json'
import type { ProtocolFile } from '@opentrons/shared-data'

interface Props {
  anticipated?: string
  inProgress: string
  completed?: string
}
export function CommandList(props: Props): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const runStatus = useRunStatus()
  if (protocolData == null) return null
  const legacyCommands = fixtureCommands.commands

  let commandType = ''
  if (props.inProgress) {
    commandType === 'running'
  } else if (props.anticipated) {
    commandType === 'queued'
  } else if (props.completed) {
    commandType === 'succeeded'
  } else {
    commandType === 'failed'
  }

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
                runStatus={runStatus}
                type={commandType}
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
          {legacyCommands.map(command => {
            let commandWholeText
            if (command.commandType === 'delay') {
              commandWholeText = (
                <Flex flexDirection={DIRECTION_ROW}>
                  <Flex
                    textTransform={TEXT_TRANSFORM_UPPERCASE}
                    padding={SPACING_1}
                    key={command.id}
                    id={`RunDetails_CommandList`}
                  >
                    {t('comment')}
                  </Flex>
                  <Flex>{command.data.legacyCommandText}</Flex>
                </Flex>
              )
            } else if (
              command.commandType !== 'loadLabware' &&
              'loadPipette' &&
              'loadModule'
            ) {
              commandWholeText = (
                <Flex key={command.id}>{command.data.legacyCommandText}</Flex>
              )
            }

            return (
              <Flex key={command.id} id={`RunDetails_CommandList`}>
                {commandType === 'queued' ? (
                  <Flex padding={SPACING_1} fontSize={FONT_SIZE_CAPTION}>
                    {t('anticipated')}
                  </Flex>
                ) : null}
                <CommandItem
                  currentCommand={
                    command.commandType !== 'loadLabware' &&
                    'loadPipette' &&
                    'loadModule'
                      ? command
                      : undefined
                  }
                  type={commandType}
                  runStatus={runStatus}
                  commandText={commandWholeText}
                />
              </Flex>
            )
          })}
        </Flex>
        <Flex padding={SPACING_1}>{t('end_of_protocol')}</Flex>
      </Flex>
    </React.Fragment>
  )
}
