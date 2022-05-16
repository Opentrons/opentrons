import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  DIRECTION_ROW,
  Icon,
  TYPOGRAPHY,
  BORDERS,
  POSITION_ABSOLUTE,
  COLORS,
  DIRECTION_COLUMN,
  Overlay,
} from '@opentrons/components'
import { useSortedProtocols } from './hooks'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/buttons'
import { Slideout } from '../../atoms/Slideout'
import { ChooseRobotSlideout } from '../ChooseRobotSlideout'
import { UploadInput } from './UploadInput'
import { ProtocolCard } from './ProtocolCard'
import { EmptyStateLinks } from './EmptyStateLinks'
import { MenuItem } from '../../atoms/MenuList/MenuItem'

import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { ProtocolSort } from './hooks'

interface ProtocolListProps {
  storedProtocols: StoredProtocolData[]
}
export function ProtocolList(props: ProtocolListProps): JSX.Element | null {
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<ProtocolSort>('alphabetical')
  const [showSortByMenu, setShowSortByMenu] = React.useState<boolean>(false)
  const toggleSetShowSortByMenu = (): void => setShowSortByMenu(!showSortByMenu)
  const { t } = useTranslation('protocol_info')
  const { storedProtocols } = props
  const [
    selectedProtocol,
    setSelectedProtocol,
  ] = React.useState<StoredProtocolData | null>(null)

  const sortedStoredProtocols = useSortedProtocols(sortBy, storedProtocols)

  const handleClickOutside: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    setShowSortByMenu(false)
  }

  return (
    <Box padding={SPACING.spacing4}>
      {selectedProtocol != null ? (
        <ChooseRobotSlideout
          onCloseClick={() => setSelectedProtocol(null)}
          showSlideout={selectedProtocol != null}
          storedProtocolData={selectedProtocol}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING.spacing5}
      >
        <StyledText as="h1">{t('protocols')}</StyledText>
        <Flex flexDirection={DIRECTION_ROW}>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            marginRight={SPACING.spacing4}
            onClick={toggleSetShowSortByMenu}
          >
            <StyledText css={TYPOGRAPHY.pSemiBold}>
              {t('labware_landing:sort_by')}
            </StyledText>
            <Icon
              height={TYPOGRAPHY.lineHeight16}
              name={showSortByMenu ? 'chevron-up' : 'chevron-down'}
            />
          </Flex>
          {showSortByMenu && (
            <Flex
              width="10rem"
              zIndex={2}
              borderRadius={BORDERS.radiusSoftCorners}
              boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
              position={POSITION_ABSOLUTE}
              backgroundColor={COLORS.white}
              top="3rem"
              right={'7rem'}
              flexDirection={DIRECTION_COLUMN}
            >
              <MenuItem
                onClick={() => {
                  setSortBy('alphabetical')
                  setShowSortByMenu(false)
                }}
              >
                {t('labware_landing:alphabetical')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('recent')
                  setShowSortByMenu(false)
                }}
              >
                {t('most_recent_updates')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('reverse')
                  setShowSortByMenu(false)
                }}
              >
                {t('labware_landing:reverse')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('oldest')
                  setShowSortByMenu(false)
                }}
              >
                {t('oldest_updates')}
              </MenuItem>
            </Flex>
          )}
          {showSortByMenu ? (
            <Overlay
              onClick={handleClickOutside}
              backgroundColor={COLORS.transparent}
            />
          ) : null}
          <SecondaryButton onClick={() => setShowSlideout(true)}>
            {t('import')}
          </SecondaryButton>
        </Flex>
      </Flex>
      <StyledText as="p" paddingBottom={SPACING.spacing4}>
        {t('all_protocols')}
      </StyledText>
      <Flex flexDirection="column">
        {sortedStoredProtocols.map(storedProtocol => (
          <ProtocolCard
            key={storedProtocol.protocolKey}
            handleRunProtocol={() => setSelectedProtocol(storedProtocol)}
            {...storedProtocol}
          />
        ))}
      </Flex>
      <EmptyStateLinks title={t('create_or_download')} />
      <Slideout
        title={t('import_new_protocol')}
        isExpanded={showSlideout}
        onCloseClick={() => setShowSlideout(false)}
      >
        <Box marginTop={SPACING.spacing4}>
          <UploadInput onUpload={() => setShowSlideout(false)} />
        </Box>
      </Slideout>
    </Box>
  )
}
