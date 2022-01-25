import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Text,
  Flex,
  Box,
  Icon,
  BaseModal,
  NewPrimaryBtn,
  SPACING_3,
  SPACING_4,
  SIZE_1,
  SIZE_2,
  SIZE_4,
  FONT_HEADER_DARK,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  RadioGroup,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { PythonLabwareOffsetSnippet } from '../../molecules/PythonLabwareOffsetSnippet'
import { useProtocolDetails } from '../RunDetails/hooks'
import { useCurrentProtocolRun } from './hooks'

const MODES = ['jupyter', 'cli'] as const

const DISPLAY_NAME_BY_MODE = {
  jupyter: 'Jupyter Notebook',
  cli: 'Command Line Interface (ssh)'
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
            <Text css={FONT_HEADER_DARK}>Download Labware Offset Data</Text>

            <Box
              onClick={props.onCloseClick}
              id={'DownloadOffsetDataModal_xButton'}
            >
              <Icon name={'close'} size={SIZE_2} />
            </Box>
          </Flex>
          <RadioGroup
            value={mode}
            options={MODES.map(mode => ({
              name: DISPLAY_NAME_BY_MODE[mode],
              value: mode,
            }))}
            onChange={handleModeSelect}
          />
          <Box size={SIZE_2}/>
          <PythonLabwareOffsetSnippet
            mode={mode}
            protocol={protocolData}
            run={runRecord?.data ?? null}
          />
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
