import * as React from 'react'

import { useTranslation } from 'react-i18next'
import {
  Icon,
  Text,
  Flex,
  FONT_SIZE_CAPTION,
  SPACING_2,
  SPACING_3,
  C_MED_GRAY,
  Link,
  SPACING_1,
  JUSTIFY_START,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

const PROTOCOL_LIBRARY_URL = 'https://protocols.opentrons.com'
const PROTOCOL_DESIGNER_URL = 'https://designer.opentrons.com'
const API_DOCS_URL = 'https://docs.opentrons.com/v2/'

interface Props {
  title?: string
}

export function EmptyStateLinks(props: Props): JSX.Element | null {
  const { t } = useTranslation('protocol_info')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      position={POSITION_ABSOLUTE}
      bottom="0"
      paddingBottom={SPACING_3}
      width="96.5%"
    >
      <Text role="complementary" as="h5" marginBottom={SPACING_2}>
        {props.title}
      </Text>
      <Flex justifyContent={JUSTIFY_START} flexDirection={DIRECTION_ROW}>
        <Link
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_GRAY}
          href={PROTOCOL_LIBRARY_URL}
          id={'EmptyStateLinks_protocolLibraryButton'}
          marginRight={SPACING_3}
          external
        >
          {t('browse_protocol_library')}
          <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
        </Link>
        <Link
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_GRAY}
          marginRight={SPACING_3}
          href={PROTOCOL_DESIGNER_URL}
          id={'EmptyStateLinks_protocolDesignerButton'}
          external
        >
          {t('launch_protocol_designer')}
          <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
        </Link>
        <Link
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_GRAY}
          href={API_DOCS_URL}
          id={'EmptyStateLinks_apiDocsButton'}
          external
        >
          {t('open_api_docs')}
          <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
        </Link>
      </Flex>
    </Flex>
  )
}
