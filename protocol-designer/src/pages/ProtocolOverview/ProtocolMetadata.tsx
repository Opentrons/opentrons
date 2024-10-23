import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  StyledText,
  ListItem,
  ListItemDescriptor,
  Btn,
} from '@opentrons/components'

import { BUTTON_LINK_STYLE } from '../../atoms'

const REQUIRED_APP_VERSION = '8.0.0'

type MetadataInfo = Array<{
  author?: string
  description?: string | null
  created?: string
  modified?: string
}>

interface ProtocolMetadataProps {
  setShowEditMetadataModal: (showEditMetadataModal: boolean) => void
  metaDataInfo: MetadataInfo
}

export function ProtocolMetadata({
  setShowEditMetadataModal,
  metaDataInfo,
}: ProtocolMetadataProps): JSX.Element {
  const { t } = useTranslation('protocol_overview')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <StyledText desktopStyle="headingSmallBold">
          {t('protocol_metadata')}
        </StyledText>
        <Flex padding={SPACING.spacing4}>
          <Btn
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
            onClick={() => {
              setShowEditMetadataModal(true)
            }}
            css={BUTTON_LINK_STYLE}
            data-testid="ProtocolOverview_MetadataEditButton"
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('edit')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {metaDataInfo.map(info => {
          const [title, value] = Object.entries(info)[0]

          return (
            <ListItem type="noActive" key={`ProtocolOverview_${title}`}>
              <ListItemDescriptor
                type="large"
                description={t(`${title}`)}
                content={value ?? t('na')}
              />
            </ListItem>
          )
        })}
        <ListItem type="noActive" key="ProtocolOverview_robotVersion">
          <ListItemDescriptor
            type="large"
            description={t('required_app_version')}
            content={t('app_version', {
              version: REQUIRED_APP_VERSION,
            })}
          />
        </ListItem>
      </Flex>
    </Flex>
  )
}
