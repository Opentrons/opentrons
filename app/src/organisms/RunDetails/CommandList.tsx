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
  SIZE_1,
  C_MED_DARK_GRAY,
  JUSTIFY_START,
} from '@opentrons/components'
import { useRunStatus } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { Status } from './CommandItem'
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

  return (
    <React.Fragment>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex margin={SPACING_1}>
          {showProtocolSetupInfo ? (
            protocolData.commands.map(command => {
              let commandTypeStatus = 'queued' as Status
              if (command.id === props.inProgress) commandTypeStatus = 'running'
              else if (command.id === props.anticipated)
                commandTypeStatus = 'queued'
              else if (command.id === props.completed)
                commandTypeStatus = 'succeeded'
              else commandTypeStatus = 'failed'

              return (
                <Flex
                  id={`RunDetails_ProtocolSetup_CommandList`}
                  key={command.id}
                >
                  <ProtocolSetupInfo
                    onCloseClick={() => setShowProtocolSetupInfo(false)}
                    SetupCommand={
                      command.commandType === 'loadLabware' ||
                      command.commandType === 'loadPipette' ||
                      command.commandType === 'loadModule'
                        ? command
                        : undefined
                    }
                    runStatus={runStatus}
                    type={commandTypeStatus}
                  />
                </Flex>
              )
            })
          ) : (
            <Btn
              width={'100%'}
              role={'link'}
              onClick={() => setShowProtocolSetupInfo(true)}
              margin={SPACING_1}
            >
              <Flex
                fontSize={FONT_SIZE_CAPTION}
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
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_DARK_GRAY}
          flexDirection={DIRECTION_COLUMN}
        >
          <Flex>
            {legacyCommands.map(command => {
              let legacyCommandTypeStatus = 'queued' as Status
              if (command.id === props.inProgress)
                legacyCommandTypeStatus = 'running'
              else if (command.id === props.anticipated)
                legacyCommandTypeStatus = 'queued'
              else if (command.id === props.completed)
                legacyCommandTypeStatus = 'succeeded'
              else legacyCommandTypeStatus = 'failed'

              let commandWholeText
              if (command.commandType === 'delay') {
                commandWholeText = (
                  <Flex>
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
                <Flex
                  key={command.id}
                  id={`RunDetails_CommandList`}
                  flex={'auto'}
                  justifyContent={JUSTIFY_START}
                  flexDirection={DIRECTION_COLUMN}
                >
                  {legacyCommandTypeStatus === 'queued' ? (
                    <Flex padding={SPACING_1} fontSize={FONT_SIZE_CAPTION}>
                      {t('anticipated')}
                    </Flex>
                  ) : null}
                  <Flex padding={SPACING_1}>{commandWholeText}</Flex>
                  {/*   TODO: immediately CommandItem takes in v6 Commands this won't work until Command types are updated, stubbing in the legacyCommand commandWholeText for now */}
                  {/* <CommandItem
                  currentCommand={command}
                  type={commandType}
                  runStatus={runStatus}
                  commandText={commandWholeText}
                /> */}
                </Flex>
              )
            })}
          </Flex>
          <Flex padding={SPACING_1}>{t('end_of_protocol')}</Flex>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
