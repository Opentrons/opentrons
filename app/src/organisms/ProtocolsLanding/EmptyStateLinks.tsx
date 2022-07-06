import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  TYPOGRAPHY,
  Icon,
  Flex,
  SPACING,
  Link,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  WRAP,
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
      <StyledText
        role="complementary"
        as="p"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginBottom={SPACING.spacing3}
      >
        {props.title}
      </StyledText>
      <Flex
        justifyContent={JUSTIFY_CENTER}
        flexDirection={DIRECTION_ROW}
        flexWrap={WRAP}
      >
        <StyledText>
          <Link
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={PROTOCOL_LIBRARY_URL}
            id={'EmptyStateLinks_protocolLibraryButton'}
            marginRight={SPACING.spacing3}
            external
          >
            {t('browse_protocol_library')}
            <Icon
              name={'open-in-new'}
              marginLeft={SPACING.spacing2}
              size="0.5rem"
            />
          </Link>
        </StyledText>
        <StyledText>
          <Link
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={PROTOCOL_DESIGNER_URL}
            id={'EmptyStateLinks_protocolDesignerButton'}
            marginRight={SPACING.spacing3}
            external
          >
            {t('launch_protocol_designer')}

            <Icon
              name={'open-in-new'}
              marginLeft={SPACING.spacing2}
              size="0.5rem"
            />
          </Link>
        </StyledText>
        <StyledText>
          <Link
            css={TYPOGRAPHY.darkLinkLabelSemiBold}
            href={API_DOCS_URL}
            id={'EmptyStateLinks_apiDocsButton'}
            marginRight={SPACING.spacing2}
            external
          >
            {t('open_api_docs')}
            <Icon
              name={'open-in-new'}
              marginLeft={SPACING.spacing2}
              size="0.5rem"
            />
          </Link>
        </StyledText>
      </Flex>
    </Flex>
  )
}
