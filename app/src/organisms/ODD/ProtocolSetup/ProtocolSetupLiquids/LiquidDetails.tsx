import { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  COLORS,
  DeckInfoLabel,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { MICRO_LITERS } from '@opentrons/shared-data'
import { LiquidsLabwareDetailsModal } from '/app/organisms/LiquidsLabwareDetailsModal'
import { getLocationInfoNames } from '/app/transformations/commands'
import { getVolumePerWell } from '/app/transformations/analysis'

import type {
  LabwareByLiquidId,
  ParsedLiquid,
  RunTimeCommand,
} from '@opentrons/shared-data'

const Table = styled('table')`
  table-layout: ${SPACING.spacingAuto};
  width: 100%;
  border-spacing: 0 ${BORDERS.borderRadius8};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  color: ${COLORS.black90};
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  padding: 0 ${SPACING.spacing24} ${SPACING.spacing8};
`
const TableRow = styled('tr')`
  height: 5.75rem;
  opacity: 90%;
`
const TableDatum = styled('td')`
  z-index: 2;
  padding: ${SPACING.spacing8} ${SPACING.spacing20};
  background-color: ${COLORS.grey30};
  font-size: ${TYPOGRAPHY.fontSize22};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.borderRadius12};
    border-bottom-left-radius: ${BORDERS.borderRadius12};
    width: 20%;
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadius12};
    border-bottom-right-radius: ${BORDERS.borderRadius12};
  }
`

interface LiquidDetailsProps {
  liquid: ParsedLiquid
  labwareByLiquidId: LabwareByLiquidId
  runId: string
  commands?: RunTimeCommand[]
}

export function LiquidDetails(props: LiquidDetailsProps): JSX.Element {
  const { liquid, labwareByLiquidId, runId, commands } = props
  const { t } = useTranslation('protocol_setup')
  const [labwareIdModal, setLabwareIdModal] = useState<string | null>(null)

  return (
    <Flex marginTop={SPACING.spacing24}>
      {labwareIdModal != null && (
        <LiquidsLabwareDetailsModal
          labwareId={labwareIdModal}
          liquidId={liquid.id}
          runId={runId}
          closeModal={() => {
            setLabwareIdModal(null)
          }}
        />
      )}
      <Table>
        <thead>
          <tr>
            <TableHeader>{t('location')}</TableHeader>
            <TableHeader>{t('labware_name')}</TableHeader>
            <TableHeader>{t('individiual_well_volume')}</TableHeader>
          </tr>
        </thead>
        <tbody>
          {labwareByLiquidId[liquid.id].map(labware => {
            const { slotName, labwareName } = getLocationInfoNames(
              labware.labwareId,
              commands
            )
            return (
              <TableRow
                key={labware.labwareId}
                aria-label={`LiquidDetails_${liquid.id}`}
                onClick={() => {
                  setLabwareIdModal(labware.labwareId)
                }}
              >
                <TableDatum>
                  <Flex>
                    <DeckInfoLabel deckLabel={slotName} />
                  </Flex>
                </TableDatum>
                <TableDatum>
                  <LegacyStyledText
                    lineHeight={TYPOGRAPHY.lineHeight28}
                    fontSize="1.375rem"
                    fontWeight={TYPOGRAPHY.fontWeightRegular}
                  >
                    {labwareName}
                  </LegacyStyledText>
                </TableDatum>

                <TableDatum>
                  <Flex flexDirection={DIRECTION_ROW}>
                    <Flex
                      height="2.75rem"
                      padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
                      width="15rem"
                      alignItems={TYPOGRAPHY.textAlignCenter}
                      marginRight={SPACING.spacingAuto}
                    >
                      {getVolumePerWell(
                        liquid.id,
                        labware.labwareId,
                        labwareByLiquidId
                      ) == null
                        ? t('variable_well_amount')
                        : `${getVolumePerWell(
                            liquid.id,
                            labware.labwareId,
                            labwareByLiquidId
                          )} ${MICRO_LITERS}`}
                    </Flex>
                    <Icon name="chevron-right" size="3rem" />
                  </Flex>
                </TableDatum>
              </TableRow>
            )
          })}
        </tbody>
      </Table>
    </Flex>
  )
}
