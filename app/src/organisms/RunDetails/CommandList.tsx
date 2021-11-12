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
  Text,
  FONT_SIZE_DEFAULT,
  C_BLACK,
  SPACING_2,
  C_NEAR_WHITE,
  C_ERROR_LIGHT,
  COLOR_ERROR,
  SPACING_3,
  SPACING_4,
  ALIGN_CENTER,
  FONT_WEIGHT_BOLD,
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
  isFailed: boolean
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
  //  @ts-expect-error - status property is not compatible right now
  const legacyCommands = schemaV6Adapter(fixtureAnalysis).commands
  if (protocolData == null) return null

  return (
    <React.Fragment>
      <Flex flexDirection={DIRECTION_COLUMN} flex={'auto'}>
        {props.isFailed ? (
          <Flex
            padding={SPACING_2}
            flexDirection={DIRECTION_COLUMN}
            flex="auto"
          >
            <Flex
              color={COLOR_ERROR}
              backgroundColor={C_ERROR_LIGHT}
              fontSize={FONT_SIZE_DEFAULT}
              padding={SPACING_2}
              border={`1px solid ${COLOR_ERROR}`}
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name="information"
                width={SPACING_4}
                marginRight={SPACING_3}
              />
              {t('protocol_run_failed')}
            </Flex>
          </Flex>
        ) : null}

        <Flex margin={SPACING_1}>
          {showProtocolSetupInfo ? (
            <React.Fragment>
              <Flex flexDirection={DIRECTION_COLUMN} flex={'auto'}>
                <Flex
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  color={C_MED_DARK_GRAY}
                  backgroundColor={C_NEAR_WHITE}
                >
                  <Text
                    textTransform={TEXT_TRANSFORM_UPPERCASE}
                    fontSize={FONT_SIZE_CAPTION}
                    id={`RunDetails_ProtocolSetupTitle`}
                  >
                    {t('protocol_setup')}
                  </Text>
                  <Btn
                    size={SIZE_1}
                    onClick={() => setShowProtocolSetupInfo(false)}
                  >
                    <Icon name="chevron-up" color={C_MED_DARK_GRAY}></Icon>
                  </Btn>
                </Flex>
                {protocolData.commands.map((command, index) => {
                  let setupCommandTypeStatus = 'queued' as Status
                  if (command.id === props.inProgress)
                    setupCommandTypeStatus = 'running'
                  else if (
                    props.anticipated != null &&
                    command.id[index] >= props.anticipated[index]
                  )
                    setupCommandTypeStatus = 'queued'
                  else if (command.id === props.completed)
                    setupCommandTypeStatus = 'succeeded'
                  else setupCommandTypeStatus = 'failed'
                  return (
                    <Flex
                      id={`RunDetails_ProtocolSetup_CommandList`}
                      key={command.id}
                      flexDirection={DIRECTION_COLUMN}
                    >
                      {props.anticipated != null &&
                      setupCommandTypeStatus === 'queued' &&
                      command.id[index] === props.anticipated[1] ? (
                        <Flex fontSize={FONT_SIZE_CAPTION}>
                          {t('anticipated')}
                        </Flex>
                      ) : null}

                      {command.commandType === 'loadLabware' ||
                      command.commandType === 'loadPipette' ||
                      command.commandType === 'loadModule' ? (
                        <ProtocolSetupInfo
                          setupCommand={command}
                          runStatus={runStatus}
                          type={setupCommandTypeStatus}
                        />
                      ) : null}
                    </Flex>
                  )
                })}
              </Flex>
            </React.Fragment>
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
                backgroundColor={C_NEAR_WHITE}
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
          <Flex
            paddingLeft={SPACING_1}
            fontSize={FONT_SIZE_DEFAULT}
            fontWeight={FONT_WEIGHT_BOLD}
            color={C_BLACK}
          >
            {t('protocol_steps')}
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} flex={'auto'}>
            {legacyCommands.map((command, index) => {
              let commandTypeStatus = 'queued' as Status
              if (command.id === props.inProgress) commandTypeStatus = 'running'
              else if (
                props.anticipated != null &&
                command.id[index] >= props.anticipated[index]
              )
                commandTypeStatus = 'queued'
              else if (command.id === props.completed)
                commandTypeStatus = 'succeeded'
              else commandTypeStatus = 'failed'

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
                  <Flex key={command.id}>
                    {/* @ts-expect-error  - data doesn't exit on type params, wait until command type is updated */}
                    {command.data.legacyCommandText}
                  </Flex>
                )
              }
              return command.commandType === 'custom' ? (
                <Flex
                  key={command.id}
                  id={`RunDetails_CommandList`}
                  paddingLeft={SPACING_1}
                  justifyContent={JUSTIFY_START}
                  flexDirection={DIRECTION_COLUMN}
                  flex={'auto'}
                >
                  {props.anticipated != null &&
                  commandTypeStatus === 'queued' &&
                  command.commandType === 'custom' &&
                  command.id[index] === props.anticipated[1] ? (
                    <Flex fontSize={FONT_SIZE_CAPTION}>{t('anticipated')}</Flex>
                  ) : null}
                  <Flex
                    padding={`${SPACING_1} ${SPACING_2} ${SPACING_1} ${SPACING_2}`}
                    flexDirection={DIRECTION_COLUMN}
                    flex={'auto'}
                  >
                    <CommandItem
                      currentCommand={command}
                      type={commandTypeStatus}
                      runStatus={runStatus}
                      commandText={commandWholeText}
                    />
                  </Flex>
                </Flex>
              ) : null
            })}
          </Flex>
          <Flex padding={SPACING_1}>{t('end_of_protocol')}</Flex>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
