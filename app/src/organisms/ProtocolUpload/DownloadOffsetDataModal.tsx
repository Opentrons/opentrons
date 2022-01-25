import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Text,
  Flex,
  Box,
  Btn,
  Icon,
  BaseModal,
  NewPrimaryBtn,
  SPACING_3,
  SPACING_4,
  SIZE_1,
  SIZE_2,
  SIZE_4,
  SIZE_5,
  FONT_HEADER_DARK,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  C_MED_GRAY,
  ALIGN_FLEX_END,
  BORDER_RADIUS_DEFAULT,
  SPACING_2,
  FONT_BODY_1_DARK,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { PythonLabwareOffsetSnippet } from '../../molecules/PythonLabwareOffsetSnippet'
import { useProtocolDetails } from '../RunDetails/hooks'
import { useCurrentProtocolRun } from './hooks'

const MODES = ['jupyter', 'cli'] as const

const DISPLAY_NAME_BY_MODE = {
  jupyter: 'Jupyter Notebook',
  cli: 'Command Line Interface (SSH)',
}
interface DownloadOffsetDataModalProps {
  onCloseClick: () => unknown
}

export const DownloadOffsetDataModal = (
  props: DownloadOffsetDataModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const { protocolData } = useProtocolDetails()
  const { runRecord } = useCurrentProtocolRun()
  const [mode, setMode] = React.useState<typeof MODES[number]>('jupyter')

  const handleModeSelect: React.ChangeEventHandler<HTMLInputElement> = event => {
    setMode(event.target.value as typeof MODES[number])
    event.target.blur()
  }
  return (
    <Portal level={'top'}>
      <BaseModal borderRadius={SIZE_1}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING_3}
          >
            <Text css={FONT_HEADER_DARK}>{t('get_labware_offset_data')}</Text>
            <Box
              onClick={props.onCloseClick}
              id={'DownloadOffsetDataModal_xButton'}
            >
              <Icon name={'close'} size={SIZE_2} />
            </Box>
          </Flex>
          <Text css={FONT_BODY_1_DARK} marginBottom={SPACING_3}>{t('choose_snippet_type')}</Text>
          <Flex>
            {MODES.map(m => (
              <Btn
                onClick={() => setMode(m)}
                width={SIZE_5}
                paddingY={SPACING_2}
                borderRadius={`${BORDER_RADIUS_DEFAULT} ${BORDER_RADIUS_DEFAULT} 0 0`}
                borderColor={C_MED_GRAY}
                borderWidth={m === mode ? '1px 1px 0 1px' : '0 0 1px 0'}
              >
                {DISPLAY_NAME_BY_MODE[m]}
              </Btn>
            ))}
            <Box
              flex="1 1 auto"
              alignSelf={ALIGN_FLEX_END}
              borderRadius={`0 ${BORDER_RADIUS_DEFAULT} 0 0`}
              borderBottom={`${C_MED_GRAY} 1px solid`}
            />
          </Flex>
          <Flex
            borderRadius={`0 0 ${BORDER_RADIUS_DEFAULT} ${BORDER_RADIUS_DEFAULT}`}
            border={`solid ${C_MED_GRAY}`} borderWidth="0 1px 1px 1px" padding={SPACING_3}>
            <PythonLabwareOffsetSnippet
              mode={mode}
              protocol={protocolData}
              run={runRecord?.data ?? null}
            />

          </Flex>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING_4}>
            <NewPrimaryBtn
              onClick={props.onCloseClick}
              width={SIZE_4}
              name="close"
              id={'DownloadOffsetDataModal_closeButton'}
            >
              {t('shared:close')}
            </NewPrimaryBtn>
          </Box>
        </Flex>
      </BaseModal>
    </Portal>
  )
}
