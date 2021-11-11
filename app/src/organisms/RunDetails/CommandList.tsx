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
  SPACING_2,
  C_NEAR_WHITE,
  C_ERROR_LIGHT,
  COLOR_ERROR,
  SPACING_3,
  SPACING_4,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useRunStatus } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { useCurrentProtocolRun } from '../ProtocolUpload/useCurrentProtocolRun'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem } from './CommandItem'
import { ProtocolFile } from '@opentrons/shared-data'

export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const runDataCommands = useCurrentProtocolRun().runRecord?.data.commands

  const currentCommandList = protocolData?.commands
  const lastProtocolSetupIndex = currentCommandList
    ?.map(
      command =>
        command.commandType === 'loadLabware' ||
        command.commandType === 'loadPipette' ||
        command.commandType === 'loadModule'
    )
    .lastIndexOf(true)
  const protocolSetupCommandList = currentCommandList?.slice(
    0,
    lastProtocolSetupIndex
  )
  currentCommandList?.splice(0, lastProtocolSetupIndex)

  React.useEffect(() => {
    if (
      runDataCommands != null &&
      runDataCommands.length !== 0 &&
      currentCommandList != null
    ) {
      // find first index after protocol setup and LPC commands
      const firstRunCommandIndex = runDataCommands.findIndex(
        command => command.id === currentCommandList[0].id
      )
      const runDataCommandsSlice = runDataCommands.slice(firstRunCommandIndex)
      runDataCommandsSlice.forEach((command, index) => {
        if (currentCommandList[index].id === command.id) {
          currentCommandList[index] = command
        }
        if (
          index <= runDataCommandsSlice.length &&
          currentCommandList[index++].id !== runDataCommandsSlice[index++].id
        ) {
          currentCommandList.length = index++
        }
      })
    }
  }, [runDataCommands, currentCommandList])
  const runStatus = useRunStatus()
  if (protocolData == null) return null

  return (
    <React.Fragment>
      <Flex flexDirection={DIRECTION_COLUMN} flex={'auto'}>
        {currentCommandList?.some(command => command.status === 'failed') ===
        true ? (
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
                {protocolSetupCommandList?.map(command => {
                  return (
                    <Flex
                      id={`RunDetails_ProtocolSetup_CommandList`}
                      key={command.id}
                      flexDirection={DIRECTION_COLUMN}
                    >
                      <ProtocolSetupInfo
                        setupCommand={command}
                        runStatus={runStatus}
                      />
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
          <Flex paddingLeft={SPACING_1}>{t('protocol_steps')}</Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {currentCommandList?.map((command, index) => {
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
                  {(index === 0 && runDataCommands?.length === 0) ||
                  (index > 0 &&
                    currentCommandList[index - 1].status === 'running') ? (
                    <Flex fontSize={FONT_SIZE_CAPTION}>{t('anticipated')}</Flex>
                  ) : null}
                  <Flex
                    padding={`${SPACING_1} ${SPACING_2} ${SPACING_1} ${SPACING_2}`}
                    flexDirection={DIRECTION_COLUMN}
                    flex={'auto'}
                  >
                    <CommandItem
                      currentCommand={command}
                      type={
                        runDataCommands?.length !== 0
                          ? command.status
                          : 'queued'
                      }
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
