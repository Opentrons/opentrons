import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  InfoScreen,
  JUSTIFY_SPACE_BETWEEN,
  LiquidIcon,
  ListItem,
  ListItemDescriptor,
  Modal,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import {
  getLabwareDisplayName,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '../../components/portals/TopPortal'

import type { LabwareOnDeck, ModuleOnDeck } from '@opentrons/components'
import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { OrderedLiquids } from '../../labware-ingred/types'

interface MaterialsListModalProps {
  hardware: ModuleOnDeck[]
  labware: LabwareOnDeck[]
  liquids: OrderedLiquids
  closeModal: () => void
}

export function MaterialsListModal({
  hardware,
  labware,
  liquids,
  closeModal,
}: MaterialsListModalProps): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  return createPortal(
    <Modal onClose={closeModal} closeOnOutsideClick title={t('materials_list')}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('deck_hardware')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {hardware.length > 0 ? (
              hardware.map((hw: ModuleOnDeck, id: number) => (
                <ListItem type="noActive" key={`hardware${id}`}>
                  <ListItemDescriptor
                    type="default"
                    description={
                      <DeckInfoLabel deckLabel={hw.moduleLocation.slotName} />
                    }
                    content={getModuleDisplayName(
                      hw.moduleModel as ModuleModel
                    )}
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
              labware.map((lw: LabwareOnDeck, id: number) => {
                const { definition, labwareLocation } = lw
                const slotName =
                  typeof labwareLocation === 'object' &&
                  'slotName' in labwareLocation
                    ? labwareLocation.slotName
                    : ''

                return (
                  <ListItem type="noActive" key={`labware_${id}`}>
                    <ListItemDescriptor
                      type="default"
                      description={<DeckInfoLabel deckLabel={slotName} />}
                      content={getLabwareDisplayName(
                        definition as LabwareDefinition2
                      )}
                    />
                  </ListItem>
                )
              })
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
            {liquids.length > 0 ? (
              <Flex
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing8}
                paddingX={SPACING.spacing12}
              >
                <StyledText
                  flex="1"
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('name')}
                </StyledText>
                <StyledText
                  flex="1.27"
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('individual_well_volume')}
                </StyledText>
              </Flex>
            ) : null}
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {liquids.length > 0 ? (
                liquids.map((liquid, id) => (
                  <ListItem type="noActive" key={`liquid_${id}`}>
                    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                      <Flex
                        alignItems={ALIGN_CENTER}
                        gridGap={SPACING.spacing8}
                        flex="1"
                      >
                        <LiquidIcon color={liquid.displayColor ?? ''} />
                        <StyledText desktopStyle="bodyDefaultRegular">
                          {liquid.name ?? t('n/a')}
                        </StyledText>
                      </Flex>

                      <Flex flex="1.27">
                        {/* ToDo (kk:08/30/2024) get the well volume */}
                        <Tag text={''} type="default" />
                      </Flex>
                    </Flex>
                  </ListItem>
                ))
              ) : (
                <InfoScreen content={t('no_liquids')} />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
