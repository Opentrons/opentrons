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
import type { ProtocolFile } from '@opentrons/shared-data'
import { useRunStatus } from '../RunTimeControl/hooks'
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
                let commandType
                if (props.inProgress) {
                  commandType === 'running'
                } else if (props.anticipated) {
                  commandType === 'queued'
                } else if (props.completed) {
                  commandType === 'succeeded'
                }
                let commandText
                if (command.commandType === 'delay'){
                  commandText = <Flex flexDirection={DIRECTION_ROW}>
                      <Flex
                        textTransform={TEXT_TRANSFORM_UPPERCASE}
                        padding={SPACING_1}
                        key={command.id}
                        id={`RunDetails_CommandList`}
                      >
                        {t('comment')}
                      </Flex>
                      <Flex>{command.params.message}</Flex>
                    </Flex>}
                    else if (
                    command.commandType !== 'loadLabware' &&
                    'loadPipette' &&
                    'loadModule') {
                      commandText = <Flex key={command.id}>{command.commandType}</Flex>
                    }
                  
                return (
                  <Flex key={command.id} id={`RunDetails_CommandList`}>
                    <CommandItem
                      currentCommand={command}
                      type={commandType}
                      runStatus={runStatus}
                      commandText={commandText}
                    />
                  </Flex>
                  // use the CommandText component that you make in your other pr to move this text into there
                  // command.commandType === 'delay' ? (
                  //   <Flex flexDirection={DIRECTION_ROW}>
                  //     <Flex
                  //       textTransform={TEXT_TRANSFORM_UPPERCASE}
                  //       padding={SPACING_1}
                  //       key={command.id}
                  //       id={`RunDetails_CommandList`}
                  //     >
                  //       {t('comment')}
                  //     </Flex>
                  //     <Flex>{command.params.message}</Flex>
                  //   </Flex>
                  // ) : (
                  //   command.commandType !== 'loadLabware' &&
                  //   'loadPipette' &&
                  //   'loadModule' && (
                  //     <Flex key={command.id}>{command.commandType}</Flex>
                  //   )
                  // )
                )
              })
            : null}
        </Flex>
        <Flex padding={SPACING_1}>{t('end_of_protocol')}</Flex>
      </Flex>
    </React.Fragment>
  )
}
