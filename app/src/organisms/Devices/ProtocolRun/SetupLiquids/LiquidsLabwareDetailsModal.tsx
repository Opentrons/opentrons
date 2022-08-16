import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import {
  Box,
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
  LabwareRender,
} from '@opentrons/components'
import {
  useProtocolDetailsForRun,
  useLabwareRenderInfoForRunById,
} from '../../../Devices/hooks'
import { Modal } from '../../../../molecules/Modal'
import { StyledText } from '../../../../atoms/text'
import { getSlotLabwareName } from '../utils/getSlotLabwareName'
import { LiquidDetailCard } from './LiquidDetailCard'
import {
  getLiquidsByIdForLabware,
  getWellFillFromLabwareId,
  getWellGroupForLiquidId,
} from './utils'

interface LiquidsLabwareDetailsModalProps {
  liquidId?: string
  labwareId: string
  runId: string
  closeModal: () => void
}

export const LiquidsLabwareDetailsModal = (
  props: LiquidsLabwareDetailsModalProps
): JSX.Element | null => {
  const { liquidId, labwareId, runId, closeModal } = props
  const { t } = useTranslation('protocol_setup')
  const currentLiquidRef = React.useRef<HTMLDivElement>(null)
  const labwareRenderInfo = useLabwareRenderInfoForRunById(runId)[labwareId]
  const commands = useProtocolDetailsForRun(runId).protocolData?.commands
  const liquids = parseLiquidsInLoadOrder()
  const labwareByLiquidId = parseLabwareInfoByLiquidId()
  const wellFill = getWellFillFromLabwareId(
    labwareId,
    liquids,
    labwareByLiquidId
  )
  const labwareInfo = getLiquidsByIdForLabware(labwareId, labwareByLiquidId)
  const { slotName, labwareName } = getSlotLabwareName(labwareId, commands)
  const loadLabwareCommand = commands
    ?.filter(command => command.commandType === 'loadLabware')
    ?.find(command => command.result.labwareId === labwareId)
  const labwareWellOrdering = loadLabwareCommand?.result.definition.ordering
  const filteredLiquidsInLoadOrder = liquids.filter(liquid => {
    return Object.keys(labwareInfo).some(key => key === liquid.liquidId)
  })
  const [selectedValue, setSelectedValue] = React.useState<typeof liquidId>(
    liquidId ?? filteredLiquidsInLoadOrder[0].liquidId
  )

  const scrollToCurrentItem = (): void => {
    currentLiquidRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  React.useEffect(() => {
    scrollToCurrentItem()
  }, [])
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  return (
    <Modal
      onClose={closeModal}
      closeOnOutsideClick
      title={labwareName}
      childrenPadding={0}
      width="45rem"
    >
      <Box
        paddingX={SPACING.spacing4}
        paddingTop={SPACING.spacing4}
        backgroundColor={COLORS.fundamentalsBackground}
        height="28.125rem"
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing3}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            maxHeight="27.125rem"
            overflowY="auto"
            css={HIDE_SCROLLBAR}
            minWidth="10.313rem"
            gridGap={SPACING.spacing3}
          >
            {filteredLiquidsInLoadOrder.map((liquid, index) => {
              const labwareInfoEntry = Object.entries(labwareInfo).find(
                entry => entry[0] === liquid.liquidId
              )

              return (
                labwareInfoEntry != null && (
                  <Flex
                    key={index}
                    ref={
                      selectedValue === liquid.liquidId
                        ? currentLiquidRef
                        : undefined
                    }
                  >
                    <LiquidDetailCard
                      {...liquid}
                      volumeByWell={labwareInfoEntry[1][0].volumeByWell}
                      labwareWellOrdering={labwareWellOrdering}
                      setSelectedValue={setSelectedValue}
                      selectedValue={selectedValue}
                    />
                  </Flex>
                )
              )
            })}
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            width="100%"
            maxHeight="25rem"
            marginLeft={SPACING.spacing4}
            marginTop={SPACING.spacing3}
          >
            <Flex flexDirection={DIRECTION_ROW}>
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText
                  as="h6"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.darkGreyEnabled}
                >
                  {t('slot_number')}
                </StyledText>
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.darkBlackEnabled}
                >
                  {slotName}
                </StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginLeft={SPACING.spacing5}
              >
                <StyledText
                  as="h6"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.darkGreyEnabled}
                >
                  {t('labware_name')}
                </StyledText>
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.darkBlackEnabled}
                >
                  {labwareName}
                </StyledText>
              </Flex>
            </Flex>
            <Flex flex="1 1 30rem" flexDirection={DIRECTION_COLUMN}>
              <svg viewBox="0 -10 130 100" transform="scale(1, -1)">
                <LabwareRender
                  definition={labwareRenderInfo.labwareDef}
                  wellFill={wellFill}
                  wellLabelOption="SHOW_LABEL_INSIDE"
                  highlightedWells={
                    selectedValue != null
                      ? getWellGroupForLiquidId(labwareInfo, selectedValue)
                      : {}
                  }
                />
              </svg>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Modal>
  )
}
