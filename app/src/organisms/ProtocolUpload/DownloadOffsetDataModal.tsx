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
} from '@opentrons/components'
import { Portal } from '../../App/portal'

interface DownloadOffsetDataModalProps {
  onCloseClick: () => unknown
}

export const DownloadOffsetDataModal = (
  props: DownloadOffsetDataModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_info', 'shared'])

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
