import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_START,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  FLEX_MAX_CONTENT,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  OverflowBtn,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  Tag,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getFullStackFromLabwares,
  getLiquidIdsOnLabwareStack,
  HOPPER_STACKER_LOCATION,
} from '@opentrons/step-generation'

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import { openIngredientSelector } from '/protocol-designer/labware-ingred/actions'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { EditLabwareQuantityModal } from '../EditLabwareQuantityModal'
import { LabwareCardOverflowMenu } from '../LabwareCardOverflowMenu'
import { getCanModifyLabwareQuantity, getLiquidText } from './utils'

import type { ReactNode } from 'react'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'

interface LabwareCardProps {
  labware: LabwareOnDeck
  quantity: number
  location: string // slotId, off-deck, fake hopper location
  lidId?: string
}

export function LabwareCard(props: LabwareCardProps): ReactNode {
  const { labware, lidId, quantity, location } = props
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation('starting_deck_state')
  const { def } = labware
  const [showQuantityModal, setShowQuantityModal] = useState<boolean>(false)
  const { labware: deckSetupLabware } = useSelector(getDeckSetupForActiveItem)
  const largestStack = getFullStackFromLabwares(deckSetupLabware, location)
  const isLabwareCardForAdapter = labware.def.allowedRoles?.includes('adapter')
  const filteredStack = largestStack.filter(
    id =>
      deckSetupLabware[id] != null &&
      (isLabwareCardForAdapter
        ? deckSetupLabware[id].def.allowedRoles?.includes('adapter')
        : !deckSetupLabware[id].def.allowedRoles?.includes('adapter'))
  )
  const isOnHopper = labware.stack.includes(HOPPER_STACKER_LOCATION)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false)
  const wellContents =
    allWellContentsForActiveItem != null
      ? Object.values(allWellContentsForActiveItem)
      : []
  const displayName = def.metadata.displayName
  const isAdapterOrTiprack =
    def.allowedRoles?.includes('adapter') || def.parameters.isTiprack
  const isLid = def.allowedRoles?.includes('lid')
  const liquidIds = getLiquidIdsOnLabwareStack(wellContents)
  const numOfUniqueLiquids = liquidIds.length

  const liquidText = getLiquidText(numOfUniqueLiquids, t)

  const canModifyQuantity = getCanModifyLabwareQuantity(def, isOnHopper)
  let editButton: null | string = null
  if (
    (isOnHopper && def.parameters.isTiprack) ||
    (isLid && canModifyQuantity)
  ) {
    editButton = t('edit_quantity')
  } else if (!isAdapterOrTiprack && canModifyQuantity) {
    editButton = t('edit_liquid_and_quantity')
  } else if (!isAdapterOrTiprack || (isLid && !canModifyQuantity)) {
    editButton = t('edit_liquid')
  }

  const handleOnClick = (): void => {
    if (editButton === t('edit_quantity')) {
      setShowQuantityModal(true)
    } else {
      dispatch(openIngredientSelector(labware.id))
      navigate('/liquids')
    }
  }
  return (
    <>
      {showQuantityModal ? (
        <EditLabwareQuantityModal
          onClose={() => {
            setShowQuantityModal(false)
          }}
          labwareId={labware.id}
          allLabwareIdsOnStack={filteredStack}
          isOnHopper={isOnHopper}
          location={location}
        />
      ) : null}
      <Box position={POSITION_RELATIVE}>
        {showOverflowMenu ? (
          <LabwareCardOverflowMenu
            setShowOverflowMenu={setShowOverflowMenu}
            // fixes bug where deleting a labware from its overflow menu deletes all non-adapter labware in the stack
            labwareIds={quantity === 1 ? [labware.id] : filteredStack}
            lidId={lidId}
          />
        ) : null}
        <ListItem type="default" backgroundColor={COLORS.grey30}>
          <Flex
            gridGap={SPACING.spacing16}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            position={POSITION_RELATIVE}
            width="100%"
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_START}
              gridGap={SPACING.spacing16}
              padding={SPACING.spacing16}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText desktopStyle="bodyDefaultSemiBold">
                  {displayName}
                </StyledText>
                {lidId != null && deckSetupLabware[lidId] != null ? (
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    color={COLORS.grey60}
                  >
                    {t('with_lid', {
                      name: deckSetupLabware[lidId].def.metadata.displayName,
                    })}
                  </StyledText>
                ) : null}
                <Flex gridGap={SPACING.spacing8} paddingTop={SPACING.spacing8}>
                  {!isAdapterOrTiprack && !isLid ? (
                    <LiquidInfoDisplay text={liquidText} />
                  ) : null}
                  {quantity > 1 ? (
                    <LiquidInfoDisplay
                      text={`Quantity: ${quantity.toString()}`}
                    />
                  ) : null}
                </Flex>
              </Flex>
              {editButton != null ? (
                <Btn
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  css={LINK_BUTTON_STYLE}
                  onClick={handleOnClick}
                >
                  <StyledText desktopStyle="captionRegular">
                    {editButton}
                  </StyledText>
                </Btn>
              ) : null}
            </Flex>
          </Flex>
          <Flex padding={`${SPACING.spacing4} ${SPACING.spacing4} 0 0`}>
            <OverflowBtn
              aria-label={`${displayName} options`}
              onClick={() => {
                setShowOverflowMenu(true)
              }}
            />
          </Flex>
        </ListItem>
      </Box>
    </>
  )
}

interface LiquidInfoDisplayProps {
  text: string
}

function LiquidInfoDisplay({ text }: LiquidInfoDisplayProps): ReactNode {
  return (
    <Flex width={FLEX_MAX_CONTENT}>
      <Tag type="default" text={text} />
    </Flex>
  )
}
