import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'

import {
  Flex,
  SPACING,
  Icon,
  LEGACY_COLORS,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  JUSTIFY_CENTER,
  SIZE_1,
  BORDERS,
  ALIGN_CENTER,
  SIZE_AUTO,
  Box,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'
import { getModuleDisplayName, MICRO_LITERS } from '@opentrons/shared-data'
import {
  useTrackEvent,
  ANALYTICS_EXPAND_LIQUID_SETUP_ROW,
  ANALYTICS_OPEN_LIQUID_LABWARE_DETAIL_MODAL,
} from '../../../../redux/analytics'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { StyledText } from '../../../../atoms/text'
import { getLocationInfoNames } from '../utils/getLocationInfoNames'
import { LiquidsLabwareDetailsModal } from './LiquidsLabwareDetailsModal'
import {
  getTotalVolumePerLiquidId,
  getTotalVolumePerLiquidLabwarePair,
} from './utils'

import type { LabwareByLiquidId } from '@opentrons/api-client'

interface SetupLiquidsListProps {
  runId: string
}

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

const LIQUID_BORDER_STYLE = css`
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${LEGACY_COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
`

export function SetupLiquidsList(props: SetupLiquidsListProps): JSX.Element {
  const { runId } = props
  const protocolData = useMostRecentCompletedAnalysis(runId)

  const liquidsInLoadOrder = parseLiquidsInLoadOrder(
    protocolData?.liquids ?? [],
    protocolData?.commands ?? []
  )

  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="31.25rem"
      overflowY="auto"
      data-testid="SetupLiquidsList_ListView"
      gridGap={SPACING.spacing8}
    >
      {liquidsInLoadOrder?.map(liquid => (
        <LiquidsListItem
          key={liquid.id}
          liquidId={liquid.id}
          description={liquid.description}
          displayColor={liquid.displayColor}
          displayName={liquid.displayName}
          runId={props.runId}
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
}

export function LiquidsListItem(props: LiquidsListItemProps): JSX.Element {
  const { liquidId, description, displayColor, displayName, runId } = props
  const { t } = useTranslation('protocol_setup')
  const [openItem, setOpenItem] = React.useState(false)
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = React.useState<
    string | null
  >(null)
  const commands = useMostRecentCompletedAnalysis(runId)?.commands

  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands ?? [])
  const trackEvent = useTrackEvent()

  const LIQUID_CARD_STYLE = css`
    ${BORDERS.cardOutlineBorder}

    &:hover {
      cursor: pointer;
      border: 1px solid ${LEGACY_COLORS.medGreyHover};
    }
  `
  const LIQUID_CARD_ITEM_STYLE = css`
    border: 1px solid ${LEGACY_COLORS.white};
    &:hover {
      cursor: pointer;
      ${BORDERS.cardOutlineBorder}
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
      backgroundColor={openItem ? LEGACY_COLORS.fundamentalsBackground : LEGACY_COLORS.white}
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
          closeModal={() => setLiquidDetailsLabwareId(null)}
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
              as="label"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing16}
              width="8.125rem"
            >
              {t('location')}
            </StyledText>
            <StyledText
              as="label"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginRight={SPACING.spacing32}
            >
              {t('labware_name')}
            </StyledText>
            <StyledText
              as="label"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              width="4.25rem"
              marginLeft="auto"
              marginRight={SPACING.spacing16}
            >
              {t('volume')}
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
                backgroundColor={LEGACY_COLORS.white}
                data-testid={`LiquidsListItem_slotRow_${String(index)}`}
                onClick={handleLiquidDetailsLabwareId}
              >
                <Flex
                  flexDirection={DIRECTION_ROW}
                  justifyContent={JUSTIFY_FLEX_START}
                  gridGap={SPACING.spacing16}
                >
                  <Flex>
                    <StyledText
                      as="p"
                      fontWeight={TYPOGRAPHY.fontWeightRegular}
                      minWidth="8.125rem"
                      alignSelf={ALIGN_CENTER}
                    >
                      {slotName}
                    </StyledText>
                  </Flex>
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    <StyledText
                      as="p"
                      fontWeight={TYPOGRAPHY.fontWeightRegular}
                    >
                      {labwareName}
                    </StyledText>
                    {adapterName != null ? (
                      <StyledText
                        as="p"
                        fontWeight={TYPOGRAPHY.fontWeightRegular}
                        color={LEGACY_COLORS.darkGreyEnabled}
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
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightRegular}
                    minWidth="4.25rem"
                    marginLeft={SPACING.spacingAuto}
                    alignSelf={ALIGN_CENTER}
                  >
                    {getTotalVolumePerLiquidLabwarePair(
                      liquidId,
                      labware.labwareId,
                      labwareByLiquidId
                    )}{' '}
                    {MICRO_LITERS}
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
    <Flex flexDirection={DIRECTION_ROW}>
      <Flex
        css={LIQUID_BORDER_STYLE}
        padding={SPACING.spacing12}
        height="max-content"
        backgroundColor={LEGACY_COLORS.white}
      >
        <Icon name="circle" color={displayColor} size={SIZE_1} />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginX={SPACING.spacing16}
        >
          {displayName}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={LEGACY_COLORS.darkGreyEnabled}
          marginX={SPACING.spacing16}
        >
          {description != null ? description : null}
        </StyledText>
      </Flex>
      <Flex
        backgroundColor={LEGACY_COLORS.darkBlackEnabled + '1A'}
        borderRadius={BORDERS.radiusSoftCorners}
        height="max-content"
        paddingY={SPACING.spacing4}
        paddingX={SPACING.spacing8}
        alignSelf={ALIGN_CENTER}
        marginLeft={SIZE_AUTO}
      >
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
          {getTotalVolumePerLiquidId(liquidId, labwareByLiquidId)}{' '}
          {MICRO_LITERS}
        </StyledText>
      </Flex>
    </Flex>
  )
}
