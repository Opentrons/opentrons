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
  ModuleIcon,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { getTopPortalEl } from '../../components/portals/TopPortal'

import type { AdditionalEquipmentName } from '@opentrons/step-generation'
import type { LabwareOnDeck, ModuleOnDeck } from '../../step-forms'
import type { OrderedLiquids } from '../../labware-ingred/types'

// ToDo (kk:09/04/2024) this should be removed when break-point is set up
const MODAL_MIN_WIDTH = '36.1875rem'

export interface FixtureInList {
  name: AdditionalEquipmentName
  id: string
  location?: string
}

interface MaterialsListModalProps {
  hardware: ModuleOnDeck[]
  fixtures: FixtureInList[]
  labware: LabwareOnDeck[]
  liquids: OrderedLiquids
  setShowMaterialsListModal: (showMaterialsListModal: boolean) => void
}

export function MaterialsListModal({
  hardware,
  fixtures,
  labware,
  liquids,
  setShowMaterialsListModal,
}: MaterialsListModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_overview', 'shared'])
  // const fixturesWithoutGripper = fixtures.filter(
  //   fixture => fixture.name !== 'gripper'
  // )

  return createPortal(
    <Modal
      onClose={() => {
        setShowMaterialsListModal(false)
      }}
      closeOnOutsideClick
      title={t('materials_list')}
      marginLeft="0rem"
      minWidth={MODAL_MIN_WIDTH}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('deck_hardware')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {fixtures.length > 0
              ? fixtures.map(fixture => {
                  return (
                    <ListItem type="noActive" key={fixture.id}>
                      <ListItemDescriptor
                        type="default"
                        description={
                          fixture.location != null ? (
                            <DeckInfoLabel
                              deckLabel={fixture.location.replace('cutout', '')}
                            />
                          ) : (
                            ''
                          )
                        }
                        content={
                          <Flex
                            alignItems={ALIGN_CENTER}
                            grigGap={SPACING.spacing4}
                          >
                            <StyledText desktopStyle="bodyDefaultRegular">
                              {t(`shared:${fixture.name}`)}
                            </StyledText>
                          </Flex>
                        }
                      />
                    </ListItem>
                  )
                })
              : null}
            {hardware.length > 0 ? (
              hardware.map((hw, id) => (
                <ListItem type="noActive" key={`hardware${id}`}>
                  <ListItemDescriptor
                    type="default"
                    description={<DeckInfoLabel deckLabel={hw.slot} />}
                    content={
                      <Flex
                        alignItems={ALIGN_CENTER}
                        grigGap={SPACING.spacing4}
                      >
                        <ModuleIcon moduleType={hw.type} size="1rem" />
                        <StyledText desktopStyle="bodyDefaultRegular">
                          {getModuleDisplayName(hw.model)}
                        </StyledText>
                      </Flex>
                    }
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
              labware.map((lw, id) => {
                return (
                  <ListItem type="noActive" key={`labware_${id}`}>
                    <ListItemDescriptor
                      type="default"
                      description={<DeckInfoLabel deckLabel={lw.slot} />}
                      content={lw.def.metadata.displayName}
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
