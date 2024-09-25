import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  LiquidIcon,
  SIZE_AUTO,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  MICRO_LITERS,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/shared-data'

import {
  useTrackEvent,
  ANALYTICS_EXPAND_LIQUID_SETUP_ROW,
  ANALYTICS_OPEN_LIQUID_LABWARE_DETAIL_MODAL,
} from '/app/redux/analytics'
import { useIsFlex } from '/app/redux-resources/robots'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { getLocationInfoNames } from '/app/transformations/commands'
import { LiquidsLabwareDetailsModal } from '/app/organisms/LiquidsLabwareDetailsModal'
import {
  getTotalVolumePerLiquidId,
  getVolumePerWell,
} from '/app/transformations/analysis'

import type { LabwareByLiquidId } from '@opentrons/shared-data'

interface SetupLiquidsListProps {
  runId: string
  robotName: string
}

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

export const CARD_OUTLINE_BORDER_STYLE = css`
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

export function SetupLiquidsList(props: SetupLiquidsListProps): JSX.Element {
  const { runId, robotName } = props
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const { t } = useTranslation('protocol_setup')
  const isFlex = useIsFlex(robotName)

  const liquidsInLoadOrder = parseLiquidsInLoadOrder(
    protocolData?.liquids ?? [],
    protocolData?.commands ?? []
  )

  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      overflowY="auto"
      data-testid="SetupLiquidsList_ListView"
      gridGap={SPACING.spacing8}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing16}
        marginTop={SPACING.spacing16}
      >
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
          marginLeft={SPACING.spacing16}
        >
          {t('liquid_information')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
          marginLeft="auto"
          marginRight={SPACING.spacing16}
        >
          {t('total_liquid_volume')}
        </StyledText>
      </Flex>
      {liquidsInLoadOrder?.map(liquid => (
        <LiquidsListItem
          key={liquid.id}
          liquidId={liquid.id}
          description={liquid.description}
          displayColor={liquid.displayColor}
          displayName={liquid.displayName}
          runId={props.runId}
          isFlex={isFlex}
        />
      ))}
    </Flex>
  )
}

interface LiquidsListItemProps {
  liquidId: string
  description: string | null
  displayColor: string
  displayName: string
  runId: string
  isFlex: boolean
}

export function LiquidsListItem(props: LiquidsListItemProps): JSX.Element {
  const {
    liquidId,
    description,
    displayColor,
    displayName,
    runId,
    isFlex,
  } = props
  const { t } = useTranslation('protocol_setup')
  const [openItem, setOpenItem] = useState(false)
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = useState<
    string | null
  >(null)
  const commands = useMostRecentCompletedAnalysis(runId)?.commands

  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands ?? [])
  const trackEvent = useTrackEvent()

  const LIQUID_CARD_STYLE = css`
    ${CARD_OUTLINE_BORDER_STYLE}

    &:hover {
      cursor: ${CURSOR_POINTER};
      border: 1px solid ${COLORS.grey35};
    }
  `
  const LIQUID_CARD_ITEM_STYLE = css`
    border: 1px solid ${COLORS.white};
    &:hover {
      cursor: ${CURSOR_POINTER};
      border: 1px solid ${COLORS.grey30};
    }
  `
  const handleSetOpenItem = (): void => {
    setOpenItem(!openItem)
    trackEvent({ name: ANALYTICS_EXPAND_LIQUID_SETUP_ROW, properties: {} })
  }
  return (
    <Box
      css={LIQUID_CARD_STYLE}
      padding={SPACING.spacing16}
      onClick={handleSetOpenItem}
      backgroundColor={openItem ? COLORS.grey10 : COLORS.white}
      data-testid="LiquidsListItem_Row"
    >
      <LiquidsListItemDetails
        liquidId={liquidId}
        labwareByLiquidId={labwareByLiquidId}
        displayColor={displayColor}
        displayName={displayName}
        description={description}
      />
      {liquidDetailsLabwareId != null && (
        <LiquidsLabwareDetailsModal
          labwareId={liquidDetailsLabwareId}
          liquidId={liquidId}
          runId={runId}
          closeModal={() => {
            setLiquidDetailsLabwareId(null)
          }}
        />
      )}
      {openItem && (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_FLEX_START}
            gridGap={SPACING.spacing16}
            marginTop={SPACING.spacing16}
            marginBottom={SPACING.spacing8}
          >
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.grey60}
              marginLeft={SPACING.spacing16}
              width="8.125rem"
            >
              {t('location')}
            </StyledText>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.grey60}
              marginRight={SPACING.spacing32}
            >
              {t('labware_name')}
            </StyledText>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.grey60}
              width="9rem"
              marginLeft="auto"
              marginRight={SPACING.spacing16}
            >
              {t('individiual_well_volume')}
            </StyledText>
          </Flex>
          {labwareByLiquidId[liquidId].map((labware, index) => {
            const {
              slotName,
              labwareName,
              adapterName,
              moduleModel,
            } = getLocationInfoNames(labware.labwareId, commands)
            const handleLiquidDetailsLabwareId = (): void => {
              setLiquidDetailsLabwareId(labware.labwareId)
              trackEvent({
                name: ANALYTICS_OPEN_LIQUID_LABWARE_DETAIL_MODAL,
                properties: {},
              })
            }
            return (
              <Box
                css={LIQUID_CARD_ITEM_STYLE}
                key={index}
                borderRadius="4px"
                marginBottom={SPACING.spacing8}
                padding={SPACING.spacing16}
                backgroundColor={COLORS.white}
                data-testid={`LiquidsListItem_slotRow_${String(index)}`}
                onClick={handleLiquidDetailsLabwareId}
              >
                <Flex
                  flexDirection={DIRECTION_ROW}
                  justifyContent={JUSTIFY_FLEX_START}
                  gridGap={SPACING.spacing16}
                >
                  <Flex minWidth="8.125rem" alignSelf={ALIGN_CENTER}>
                    {isFlex ? (
                      <DeckInfoLabel deckLabel={slotName} />
                    ) : (
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {slotName}
                      </StyledText>
                    )}
                  </Flex>
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {labwareName}
                    </StyledText>
                    {adapterName != null ? (
                      <StyledText
                        desktopStyle="bodyDefaultRegular"
                        color={COLORS.grey50}
                      >
                        {moduleModel != null
                          ? t('on_adapter_in_mod', {
                              adapterName: adapterName,
                              moduleName: getModuleDisplayName(moduleModel),
                            })
                          : t('on_adapter', {
                              adapterName: adapterName,
                            })}
                      </StyledText>
                    ) : null}
                  </Flex>
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    minWidth="8.75rem"
                    marginLeft={SPACING.spacingAuto}
                    alignSelf={ALIGN_CENTER}
                  >
                    {getVolumePerWell(
                      liquidId,
                      labware.labwareId,
                      labwareByLiquidId
                    ) == null
                      ? t('variable_well_amount')
                      : `${getVolumePerWell(
                          liquidId,
                          labware.labwareId,
                          labwareByLiquidId
                        )} ${MICRO_LITERS}`}
                  </StyledText>
                </Flex>
              </Box>
            )
          })}
        </Flex>
      )}
    </Box>
  )
}

interface LiquidsListItemDetailsProps {
  liquidId: string
  labwareByLiquidId: LabwareByLiquidId
  displayColor: string
  displayName: string
  description: string | null
}

export const LiquidsListItemDetails = (
  props: LiquidsListItemDetailsProps
): JSX.Element => {
  const {
    liquidId,
    labwareByLiquidId,
    displayColor,
    displayName,
    description,
  } = props
  return (
    <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
      <LiquidIcon color={displayColor} />
      <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          marginX={SPACING.spacing16}
        >
          {displayName}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
          marginX={SPACING.spacing16}
        >
          {description != null ? description : null}
        </StyledText>
      </Flex>
      <Flex
        backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
        borderRadius={BORDERS.borderRadius4}
        height="max-content"
        padding={`${SPACING.spacing2} ${SPACING.spacing8}`}
        alignSelf={ALIGN_CENTER}
        marginLeft={SIZE_AUTO}
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {getTotalVolumePerLiquidId(liquidId, labwareByLiquidId).toFixed(1)}{' '}
          {MICRO_LITERS}
        </StyledText>
      </Flex>
    </Flex>
  )
}
