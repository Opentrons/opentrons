import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  StyledText,
  Modal,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ListItem,
  ListItemDescriptor,
  InfoScreen,
} from '@opentrons/components'

import type { ModuleOnDeck } from '@opentrons/components'

interface MaterialsListModalProps {
  hardware: ModuleOnDeck[]
  labware: any[]
  liquids: any[]
  closeModal: () => void
}

export function MaterialsListModal({
  hardware,
  labware,
  liquids,
  closeModal,
}: MaterialsListModalProps): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  return (
    <Modal onClose={closeModal} closeOnOutsideClick title={t('materials_list')}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('deck_hardware')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {hardware.length > 0 ? (
              hardware.map((hw, id) => (
                <ListItem type="noActive" key={`hardware${id}`}>
                  <ListItemDescriptor
                    type="default"
                    description={hw}
                    content={hw}
                  />
                </ListItem>
              ))
            ) : (
              <InfoScreen content={t('no_deck_hardware')} />
            )}
          </Flex>
        </Flex>

        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('labware')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {labware.length > 0 ? (
              labware.map((lw, id) => (
                <ListItem type="noActive" key={`labware_${id}`}>
                  <ListItemDescriptor
                    type="default"
                    description={lw}
                    content={lw}
                  />
                </ListItem>
              ))
            ) : (
              <InfoScreen content={t('no_labware')} />
            )}
          </Flex>
        </Flex>

        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('liquids')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing8}
              paddingY={SPACING.spacing12}
            ></Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {liquids.length > 0 ? (
                liquids.map((liquid, id) => (
                  <ListItem type="noActive" key={`liquid_${id}`}>
                    <ListItemDescriptor
                      type="default"
                      description={liquid}
                      content={liquid}
                    />
                  </ListItem>
                ))
              ) : (
                <InfoScreen content={t('no_liquids')} />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
