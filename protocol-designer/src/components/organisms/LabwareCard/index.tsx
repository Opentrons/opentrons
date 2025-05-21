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
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { openIngredientSelector } from '../../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { getLabwareNicknamesById } from '../../../ui/labware/selectors'
import { LINK_BUTTON_STYLE } from '../../atoms'
import { LabwareCardOverflowMenu } from '../LabwareCardOverflowMenu'
import { getLiquidIdsOnLabware } from '../utils'

import type { LabwareOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'

interface LabwareCardProps {
  labware: LabwareOnDeck
  quantity: number
  lidDisplayName?: string
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { labware, lidDisplayName, quantity } = props
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation('starting_deck_state')
  const { def } = labware
  const { labware: deckSetupLabware } = useSelector(getDeckSetupForActiveItem)
  const allLabwareIdsOnStack = Object.values(deckSetupLabware)
    .filter(
      lw =>
        lw.labwareDefURI === labware.labwareDefURI &&
        getSlotInLocationStack(lw.stack) ===
          getSlotInLocationStack(labware.stack)
    )
    ?.map(lw => lw.id)
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
  const isNicknameDifferent = nickName !== displayName
  const liquidIds = getLiquidIdsOnLabware(wellContents)

  return (
    <Box position={POSITION_RELATIVE}>
      {showOverflowMenu ? (
        <LabwareCardOverflowMenu
          setShowOverflowMenu={setShowOverflowMenu}
          labwareIds={allLabwareIdsOnStack}
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
                <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                  {displayName}
                </StyledText>
              ) : null}
              {lidDisplayName != null ? (
                <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                  {t('with_lid', { name: lidDisplayName })}
                </StyledText>
              ) : null}

              <Flex gridGap={SPACING.spacing8}>
                {!isAdapterOrTiprack ? (
                  <Flex width={FLEX_MAX_CONTENT}>
                    <Tag
                      type="default"
                      text={
                        liquidIds.length === 0
                          ? t('no_liquids_added')
                          : t('num_liquid', { count: liquidIds.length })
                      }
                    />
                  </Flex>
                ) : null}
                {quantity > 1 ? (
                  <Flex width={FLEX_MAX_CONTENT}>
                    <Tag
                      type="default"
                      text={`Quantity: ${quantity.toString()}`}
                    />
                  </Flex>
                ) : null}
              </Flex>
            </Flex>
            {!isAdapterOrTiprack ? (
              <Btn
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                css={LINK_BUTTON_STYLE}
                onClick={() => {
                  dispatch(openIngredientSelector(labware.id))
                  navigate('/liquids')
                }}
                data-testid="LabwareCard_addLiquid_button"
              >
                <StyledText desktopStyle="captionRegular">
                  {t('add_liquid')}
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
  )
}
