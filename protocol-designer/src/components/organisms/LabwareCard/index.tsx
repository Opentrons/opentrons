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

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import { getEnableStacking } from '/protocol-designer/feature-flags/selectors'
import { openIngredientSelector } from '/protocol-designer/labware-ingred/actions'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { getAllLabwareIdsOfCertainURIOnStack } from '/protocol-designer/utils'

import { EditLabwareQuantityModal } from '../EditLabwareQuantityModal'
import { LabwareCardOverflowMenu } from '../LabwareCardOverflowMenu'
import { getLiquidIdsOnLabware } from '../utils'

import type { LabwareOnDeck } from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'

interface LabwareCardProps {
  labware: LabwareOnDeck
  quantity: number
  lidId?: string
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { labware, lidId, quantity } = props
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation('starting_deck_state')
  const { def } = labware
  const enableStacking = useSelector(getEnableStacking)
  const [showQuantityModal, setShowQuantityModal] = useState<boolean>(false)
  const { labware: deckSetupLabware } = useSelector(getDeckSetupForActiveItem)
  const allLabwareIdsOnStack = getAllLabwareIdsOfCertainURIOnStack(
    deckSetupLabware,
    labware
  )
  const nickNames = useSelector(getLabwareNicknamesById)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false)
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[labware.id]
      : null
  const displayName = labware.def.metadata.displayName
  const nickName = nickNames[labware.id]
  const isAdapterOrTiprack =
    def.allowedRoles?.includes('adapter') || def.parameters.isTiprack
  const isLid = def.allowedRoles?.includes('lid')
  const isNicknameDifferent = nickName !== displayName
  const liquidIds = getLiquidIdsOnLabware(wellContents)
  const canModifyQuantity =
    labware.def.stackLimit != null && labware.def.stackLimit > 1

  let editButton: null | string = null
  if (isLid && canModifyQuantity) {
    editButton = t('edit_quantity')
  } else if (!isAdapterOrTiprack && canModifyQuantity && enableStacking) {
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
          allLabwareIdsOnStack={allLabwareIdsOnStack}
        />
      ) : null}
      <Box position={POSITION_RELATIVE}>
        {showOverflowMenu ? (
          <LabwareCardOverflowMenu
            setShowOverflowMenu={setShowOverflowMenu}
            labwareIds={allLabwareIdsOnStack}
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
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                <StyledText desktopStyle="bodyDefaultSemiBold">
                  {nickName}
                </StyledText>
                {isNicknameDifferent ? (
                  <StyledText
                    desktopStyle="captionRegular"
                    color={COLORS.grey60}
                  >
                    {displayName}
                  </StyledText>
                ) : null}
                {lidId != null && deckSetupLabware[lidId] != null ? (
                  <StyledText
                    desktopStyle="captionRegular"
                    color={COLORS.grey60}
                  >
                    {t('with_lid', {
                      name: deckSetupLabware[lidId].def.metadata.displayName,
                    })}
                  </StyledText>
                ) : null}

                <Flex gridGap={SPACING.spacing8}>
                  {!isAdapterOrTiprack && !isLid ? (
                    <LiquidInfoDisplay
                      text={
                        liquidIds.length === 0
                          ? t('no_liquids_added')
                          : t('num_liquid', { count: liquidIds.length })
                      }
                    />
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
                  data-testid="LabwareCard_addLiquid_button"
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
              data-testid="LabwareCard_overflowBtn"
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

function LiquidInfoDisplay({ text }: LiquidInfoDisplayProps): JSX.Element {
  return (
    <Flex width={FLEX_MAX_CONTENT}>
      <Tag type="default" text={text} />
    </Flex>
  )
}
