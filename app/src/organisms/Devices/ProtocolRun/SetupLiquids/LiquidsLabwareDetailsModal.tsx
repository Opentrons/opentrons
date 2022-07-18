import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
  LabwareRender,
} from '@opentrons/components'
import {
  useProtocolDetailsForRun,
  useLabwareRenderInfoForRunById,
} from '../../../Devices/hooks'
import { Modal } from '../../../../atoms/Modal'
import { StyledText } from '../../../../atoms/text'
import { LiquidDetailCard } from './LiquidDetailCard'
import {
  getSlotLabwareName,
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
  const [selectedValue, setSelectedValue] = React.useState<typeof liquidId>(
    liquidId
  )
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

  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  return (
    <Modal
      onClose={closeModal}
      title={labwareName}
      closeOnOutsideClick
      width="46.875rem"
    >
      <Box>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing3}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            css={HIDE_SCROLLBAR}
            maxHeight={'27.125rem'}
            overflowY={'auto'}
            minWidth={'10.313rem'}
          >
            {Object.entries(labwareInfo).map((entry, index) => {
              const liquidInfo = liquids.find(
                liquid => liquid.liquidId === entry[0]
              )
              return (
                liquidInfo != null && (
                  <LiquidDetailCard
                    key={index}
                    {...liquidInfo}
                    volumeByWell={entry[1][0].volumeByWell}
                    labwareWellOrdering={labwareWellOrdering}
                    setSelectedValue={setSelectedValue}
                    selectedValue={selectedValue}
                  />
                )
              )
            })}
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} marginX={SPACING.spacingL}>
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
                  color={COLORS.darkBlack}
                >
                  {slotName}
                </StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} marginX={SPACING.spacingL}>
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
                  color={COLORS.darkBlack}
                >
                  {labwareName}
                </StyledText>
              </Flex>
            </Flex>
            <Box width={'30.625rem'}>
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
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Modal>
  )
}
