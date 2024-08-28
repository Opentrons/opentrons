import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ALIGN_CENTER,
  ALIGN_END,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  INFO_TOAST,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
  Tabs,
  ToggleGroup,
} from '@opentrons/components'

import { useKitchen } from '../../organisms/Kitchen/hooks'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { getFileMetadata } from '../../file-data/selectors'
import { DeckSetupContainer } from './DeckSetup'
import { OffDeck } from './Offdeck'

import type { CutoutId } from '@opentrons/shared-data'
import type { DeckSlot } from '@opentrons/step-generation'

export interface OpenSlot {
  cutoutId: CutoutId
  slot: DeckSlot
}

export function Designer(): JSX.Element {
  const { t } = useTranslation([
    'starting_deck_state',
    'protocol_steps',
    'shared',
  ])
  const { bakeToast } = useKitchen()
  const navigate = useNavigate()
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const metadata = useSelector(getFileMetadata)
  const [zoomInOnSlot, setZoomInOnSlot] = React.useState<OpenSlot | null>(null)
  const [tab, setTab] = React.useState<'startingDeck' | 'protocolSteps'>(
    'startingDeck'
  )
  const leftString = t('onDeck')
  const rightString = t('offDeck')

  const [deckView, setDeckView] = React.useState<
    typeof leftString | typeof rightString
  >(leftString)

  const { modules, additionalEquipmentOnDeck } = deckSetup
  const startingDeckTab = {
    text: t('protocol_starting_deck'),
    isActive: tab === 'startingDeck',
    onClick: () => {
      setTab('startingDeck')
    },
  }
  const protocolStepTab = {
    text: t('protocol_steps:protocol_steps'),
    isActive: tab === 'protocolSteps',
    onClick: () => {
      setTab('protocolSteps')
    },
  }

  const hasHardware =
    (modules != null && Object.values(modules).length > 0) ||
    // greater than 1 to account for the default loaded trashBin
    Object.values(additionalEquipmentOnDeck).length > 1

  // only display toast if its a newly made protocol
  React.useEffect(() => {
    if (hasHardware && metadata?.lastModified == null) {
      bakeToast(t('add_rest') as string, INFO_TOAST, {
        heading: t('we_added_hardware'),
        closeButton: true,
      })
    }
  }, [])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING.spacing12}>
        {zoomInOnSlot != null ? null : (
          <Tabs tabs={[startingDeckTab, protocolStepTab]} />
        )}
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {metadata?.protocolName != null && metadata?.protocolName !== ''
              ? metadata?.protocolName
              : t('untitled_protocol')}
          </StyledText>
          <Flex color={COLORS.grey60} justifyContent={JUSTIFY_CENTER}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('edit_protocol')}
            </StyledText>
          </Flex>
        </Flex>
        <Flex gridGap={SPACING.spacing8}>
          <PrimaryButton
            onClick={() => {
              //  TODO: wire up liquids overflow menu
              console.log('wire up liquids')
            }}
          >
            <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
              <Icon size="1rem" name="liquid" />
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('liquids')}
              </StyledText>
            </Flex>
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              navigate('/overview')
            }}
          >
            {t('shared:done')}
          </SecondaryButton>
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.grey10}
        padding={SPACING.spacing80}
        height="calc(100vh - 64px)"
      >
        {tab === 'startingDeck' ? (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <Flex alignSelf={ALIGN_END}>
              <ToggleGroup
                selectedValue={deckView}
                leftText={leftString}
                rightText={rightString}
                leftClick={() => {
                  setDeckView(leftString)
                }}
                rightClick={() => {
                  setDeckView(rightString)
                }}
              />
            </Flex>
            {deckView === leftString ? (
              <DeckSetupContainer
                setZoomInOnSlot={setZoomInOnSlot}
                zoomIn={zoomInOnSlot}
              />
            ) : (
              <OffDeck />
            )}
          </Flex>
        ) : (
          <div>TODO wire this up</div>
        )}
      </Flex>
    </Flex>
  )
}
