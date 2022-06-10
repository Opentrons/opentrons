import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  TYPOGRAPHY,
  Icon,
  Flex,
  FONT_SIZE_CAPTION,
  SPACING,
  Link,
  JUSTIFY_START,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

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
      marginY={SPACING.spacing6}
      paddingBottom={SPACING.spacing3}
      width="96.5%"
    >
      <StyledText role="complementary" as="h5" marginBottom={SPACING.spacing3}>
        {props.title}
      </StyledText>
      <Flex justifyContent={JUSTIFY_START} flexDirection={DIRECTION_ROW}>
        <Link
          fontSize={FONT_SIZE_CAPTION}
          css={TYPOGRAPHY.darkLinkPSemiBold}
          color={COLORS.darkBlack}
          href={PROTOCOL_LIBRARY_URL}
          id={'EmptyStateLinks_protocolLibraryButton'}
          marginRight={SPACING.spacing3}
          opacity="0.7"
          external
        >
          {t('browse_protocol_library')}
          <Icon
            name={'open-in-new'}
            marginLeft={SPACING.spacing2}
            size="0.5rem"
            opacity="0.7"
          />
        </Link>
        <Link
          fontSize={FONT_SIZE_CAPTION}
          css={TYPOGRAPHY.darkLinkPSemiBold}
          color={COLORS.darkBlack}
          marginRight={SPACING.spacing3}
          href={PROTOCOL_DESIGNER_URL}
          id={'EmptyStateLinks_protocolDesignerButton'}
          opacity="0.7"
          external
        >
          <Flex alignItems={ALIGN_CENTER} css={TYPOGRAPHY.darkLinkPSemiBold}>
            {t('launch_protocol_designer')}

            <Icon
              name={'open-in-new'}
              marginLeft={SPACING.spacing2}
              size="0.5rem"
              opacity="0.7"
            />
          </Flex>
        </Link>

        <Link
          fontSize={FONT_SIZE_CAPTION}
          css={TYPOGRAPHY.darkLinkPSemiBold}
          color={COLORS.darkBlack}
          href={API_DOCS_URL}
          id={'EmptyStateLinks_apiDocsButton'}
          external
        >
          {t('open_api_docs')}
          <Icon
            name={'open-in-new'}
            marginLeft={SPACING.spacing2}
            size="0.5rem"
            opacity="0.7"
          />
        </Link>
      </Flex>
    </Flex>
  )
}
