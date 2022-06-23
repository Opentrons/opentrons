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
} from '@opentrons/components'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { Modal } from '../../../../atoms/Modal'
import { StyledText } from '../../../../atoms/text'
import { LiquidDetailCard } from './LiquidDetailCard'
import { getSlotLabwareName, getLiquidsByIdForLabware } from './utils'

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

  const commands = useProtocolDetailsForRun(runId).protocolData?.commands
  const liquids = parseLiquidsInLoadOrder()
  const labwareByLiquidId = parseLabwareInfoByLiquidId()

  const labwareInfo = getLiquidsByIdForLabware(labwareId, labwareByLiquidId)
  const { slotName, labwareName } = getSlotLabwareName(labwareId, commands)

  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  return (
    <Modal
      onClose={closeModal}
      title={labwareName}
      contentBackgroundColor={COLORS.background}
      closeOnOutsideClick
      width="46.875rem"
    >
      <Box>
        <Flex flexDirection={DIRECTION_ROW}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            css={HIDE_SCROLLBAR}
            maxHeight={'27.125rem'}
            overflowY={'auto'}
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
            <Box>Labware render placeholder</Box>
          </Flex>
        </Flex>
      </Box>
    </Modal>
  )
}
