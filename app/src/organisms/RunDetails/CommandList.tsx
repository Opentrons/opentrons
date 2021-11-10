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
  Box,
} from '@opentrons/components'
import { useRunStatus } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem, Status } from './CommandItem'
import fixtureAnalysis from '@opentrons/app/src/organisms/RunDetails/Fixture_analysis.json'
import { ProtocolFile, schemaV6Adapter } from '@opentrons/shared-data'

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
  //  @ts-expect-error
  const legacyCommands = schemaV6Adapter(fixtureAnalysis).commands
  if (protocolData == null) return null

  return (
    <React.Fragment>
      <Box width="48rem">
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
          <Flex padding={SPACING_1}>{t('protocol_steps')}</Flex>
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
                    <Flex>{command.result}</Flex>
                  </Flex>
                )
              } else if (command.commandType === 'custom') {
                commandWholeText = (
                  //  @ts-expect-error
                  <Flex key={command.id}>{command.data.legacyCommandText}</Flex>
                )
              }

              return (
                <Flex
                  key={command.id}
                  id={`RunDetails_CommandList`}
                  flex={'auto'}
                  justifyContent={JUSTIFY_START}
                  padding={SPACING_1}
                  flexDirection={DIRECTION_COLUMN}
                >
                  {legacyCommandTypeStatus === 'queued' ? (
                    <Flex padding={SPACING_1} fontSize={FONT_SIZE_CAPTION}>
                      {t('anticipated')}
                    </Flex>
                  ) : null}
                  <Flex paddingLeft={SPACING_1}>
                    <CommandItem
                      currentCommand={command}
                      type={legacyCommandTypeStatus}
                      runStatus={runStatus}
                      commandText={commandWholeText}
                    />
                  </Flex>
                </Flex>
              )
            })}
          </Flex>
          <Flex padding={SPACING_1}>{t('end_of_protocol')}</Flex>
        </Flex>
      </Box>
    </React.Fragment>
  )
}
