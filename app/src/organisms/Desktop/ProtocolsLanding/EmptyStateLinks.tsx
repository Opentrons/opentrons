import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'

const PROTOCOL_LIBRARY_URL = 'https://library.opentrons.com'
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
      marginY={SPACING.spacing32}
      paddingBottom={SPACING.spacing8}
      width="96.5%"
    >
      <LegacyStyledText
        role="complementary"
        as="p"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginBottom={SPACING.spacing8}
      >
        {props.title}
      </LegacyStyledText>
      <Flex
        justifyContent={JUSTIFY_CENTER}
        flexDirection={DIRECTION_ROW}
        flexWrap={WRAP}
      >
        <LegacyStyledText>
          <Link
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={PROTOCOL_LIBRARY_URL}
            id="EmptyStateLinks_protocolLibraryButton"
            marginRight={SPACING.spacing8}
            external
          >
            {t('browse_protocol_library')}
            <Icon
              name="open-in-new"
              marginLeft={SPACING.spacing4}
              size="0.5rem"
            />
          </Link>
        </LegacyStyledText>
        <LegacyStyledText>
          <Link
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={PROTOCOL_DESIGNER_URL}
            id="EmptyStateLinks_protocolDesignerButton"
            marginRight={SPACING.spacing8}
            external
          >
            {t('launch_protocol_designer')}

            <Icon
              name="open-in-new"
              marginLeft={SPACING.spacing4}
              size="0.5rem"
            />
          </Link>
        </LegacyStyledText>
        <LegacyStyledText>
          <Link
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={API_DOCS_URL}
            id="EmptyStateLinks_apiDocsButton"
            marginRight={SPACING.spacing4}
            external
          >
            {t('open_api_docs')}
            <Icon
              name="open-in-new"
              marginLeft={SPACING.spacing4}
              size="0.5rem"
            />
          </Link>
        </LegacyStyledText>
      </Flex>
    </Flex>
  )
}
