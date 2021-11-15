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
  FONT_HEADER_DARK,
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
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { useRunStatus } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem } from './CommandItem'
import type { ProtocolFile, Command } from '@opentrons/shared-data'
import type { RunCommandSummary } from '@opentrons/api-client'

export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const runDataCommands = useCurrentProtocolRun().runRecord?.data.commands

  const currentCommandList: Array<Command | RunCommandSummary> =
    protocolData != null ? [...protocolData?.commands] : []
  const lastProtocolSetupIndex = currentCommandList
    .map(
      command =>
        command.commandType === 'loadLabware' ||
        command.commandType === 'loadPipette' ||
        command.commandType === 'loadModule'
    )
    .lastIndexOf(true)
  const protocolSetupCommandList = currentCommandList?.slice(
    0,
    lastProtocolSetupIndex + 1
  )
  currentCommandList?.splice(0, lastProtocolSetupIndex + 1)

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
          index <= currentCommandList.length &&
          currentCommandList[index + 1].id !==
            runDataCommandsSlice[index + 1].id
        ) {
          currentCommandList.length = index + 1
        }
      })
    }
  }, [runDataCommands, currentCommandList])
  const runStatus = useRunStatus()
  if (protocolData == null || runStatus == null) return null

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
        <Flex
          paddingLeft={SPACING_2}
          css={FONT_HEADER_DARK}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
        >
          {t('protocol_steps')}
        </Flex>
        <Flex margin={SPACING_1}>
          {showProtocolSetupInfo ? (
            <React.Fragment>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                flex={'auto'}
                backgroundColor={C_NEAR_WHITE}
                marginLeft={SPACING_2}
              >
                <Flex
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  color={C_MED_DARK_GRAY}
                >
                  <Text
                    textTransform={TEXT_TRANSFORM_UPPERCASE}
                    fontSize={FONT_SIZE_CAPTION}
                    id={`RunDetails_ProtocolSetupTitle`}
                    paddingLeft={SPACING_2}
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
                <Flex
                  id={`RunDetails_ProtocolSetup_CommandList`}
                  flexDirection={DIRECTION_COLUMN}
                  marginLeft={SPACING_2}
                >
                  {protocolSetupCommandList?.map(command => {
                    return (
                      <ProtocolSetupInfo
                        key={command.id}
                        setupCommand={command as Command}
                      />
                    )
                  })}
                </Flex>
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
                marginLeft={SPACING_1}
              >
                <Flex paddingLeft={SPACING_2}>{t('protocol_setup')}</Flex>
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
          <Flex flexDirection={DIRECTION_COLUMN}>
            {currentCommandList?.map((command, index) => {
              return command.commandType === 'custom' ? (
                <Flex
                  key={command.id}
                  id={`RunDetails_CommandItem`}
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
                      runStatus={runStatus}
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
