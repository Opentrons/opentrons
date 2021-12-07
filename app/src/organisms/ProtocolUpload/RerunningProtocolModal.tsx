import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  Text,
  Flex,
  Link,
  Box,
  Icon,
  BaseModal,
  NewPrimaryBtn,
  SPACING_3,
  SPACING_4,
  SIZE_1,
  SIZE_2,
  SIZE_4,
  C_BLUE,
  FONT_HEADER_DARK,
  FONT_BODY_1_DARK,
  DIRECTION_ROW,
  FONT_SIZE_BODY_1,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_1,
  DIRECTION_COLUMN,
  SPACING_2,
} from '@opentrons/components'
import { Portal } from '../../App/portal'

interface RerunningProtocolModalProps {
  onCloseClick: () => unknown
}

const UPLOAD_PROTOCOL_URL =
  'http://support.opentrons.com/en/articles/5742955-how-labware-offsets-work-on-the-ot-2'

export const RerunningProtocolModal = (
  props: RerunningProtocolModalProps
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
            <Text css={FONT_HEADER_DARK}>
              {t('rerunning_protocol_modal_header')}
            </Text>
            <Box
              onClick={props.onCloseClick}
              id={'RerunningProtocolModal_xButton'}
            >
              <Icon name={'close'} size={SIZE_2} />
            </Box>
          </Flex>
          <Trans
            t={t}
            i18nKey={`rerunning_protocol_modal_body`}
            components={{
              block: <Text css={FONT_BODY_1_DARK} marginTop={SPACING_1} />,
            }}
          />
          <Link
            fontSize={FONT_SIZE_BODY_1}
            color={C_BLUE}
            href={UPLOAD_PROTOCOL_URL}
            marginTop={SPACING_2}
            id={'RerunningProtocolModal_Link'}
            external
          >
            {t('rerunning_protocol_modal_link')}
            <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
          </Link>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING_4}>
            <NewPrimaryBtn
              onClick={props.onCloseClick}
              width={SIZE_4}
              name="close"
              id={'RerunningProtocolModal_closeButton'}
            >
              {t('shared:close')}
            </NewPrimaryBtn>
          </Box>
        </Flex>
      </BaseModal>
    </Portal>
  )
}
