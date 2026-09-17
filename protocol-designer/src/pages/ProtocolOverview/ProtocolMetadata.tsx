import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  ListItemDescriptor,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import { LINK_BUTTON_STYLE } from '../../components/atoms'

import type { ReactNode } from 'react'

interface MetadataItem {
  title: string
  value: string | null
}

interface ProtocolMetadataProps {
  setShowEditMetadataModal: (showEditMetadataModal: boolean) => void
  metaDataInfo: MetadataItem[]
}

export function ProtocolMetadata({
  setShowEditMetadataModal,
  metaDataInfo,
}: ProtocolMetadataProps): ReactNode {
  const { t } = useTranslation('protocol_overview')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="headingSmallBold">
          {t('protocol_metadata')}
        </StyledText>
        <Flex padding={SPACING.spacing4}>
          <Btn
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
            onClick={() => {
              setShowEditMetadataModal(true)
            }}
            css={LINK_BUTTON_STYLE}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('edit')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {metaDataInfo.map(({ title, value }) => (
          <ListItem type="default" key={`ProtocolOverview_${title}`}>
            <ListItemDescriptor
              type="large"
              description={
                <Flex minWidth="13.75rem">
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    color={COLORS.grey60}
                  >
                    {t(`${title}`)}
                  </StyledText>
                </Flex>
              }
              content={
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  className={clsx(
                    lineClampStyles.line_clamp,
                    lineClampStyles.word_break_all
                  )}
                  style={{ WebkitLineClamp: 2 }}
                >
                  {value ?? t('na')}
                </StyledText>
              }
            />
          </ListItem>
        ))}
        <ListItem type="default" key="ProtocolOverview_robotVersion">
          <ListItemDescriptor
            type="large"
            description={
              <Flex minWidth="13.75rem">
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('required_app_version')}
                </StyledText>
              </Flex>
            }
            content={
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('app_version', {
                  version: _OT_PD_REQUIRED_APP_VERSION_,
                })}
              </StyledText>
            }
          />
        </ListItem>
      </Flex>
    </Flex>
  )
}
