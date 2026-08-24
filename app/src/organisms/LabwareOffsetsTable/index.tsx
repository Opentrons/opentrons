import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListAccordion,
  ListTable,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { selectAllLabwareInfoAndDefaultStatusSorted } from '/app/redux/protocol-runs'

import { AccordionChildren } from './AccordionChildren'
import { AccordionHeader } from './AccordionHeader'

import type { ReactNode } from 'react'
import type { ListAccordionProps } from '@opentrons/components'

export interface LabwareOffsetsTableProps {
  runId: string
}

export function LabwareOffsetsTable(
  props: LabwareOffsetsTableProps
): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const { runId } = props

  const labwareInfo = useSelector(
    selectAllLabwareInfoAndDefaultStatusSorted(runId)
  )

  const alertKind = (
    missingOffset: boolean
  ): ListAccordionProps['alertKind'] => {
    return missingOffset ? 'warning' : 'default'
  }

  return (
    <Flex css={CONTAINER_STYLE}>
      <ListTable headers={[<TableHeaders key="1" />]}>
        {labwareInfo.map(aLwInfo => (
          <ListAccordion
            key={aLwInfo.uri}
            alertKind={alertKind(aLwInfo.isMissingNecessaryDefaultOffset)}
            tableHeaders={[
              <StyledText key="location" css={LOCATION_COLUMN_STYLE}>
                {t('location')}
              </StyledText>,
              t('offset_type'),
              <StyledText key="offset" css={OFFSET_COLUMN_STYLE}>
                {t('offset')}
              </StyledText>,
            ]}
            headerChild={
              <AccordionHeader
                {...props}
                uri={aLwInfo.uri}
                lwDisplayName={aLwInfo.info.displayName}
                lwVersion={aLwInfo.info.version}
              />
            }
          >
            <AccordionChildren {...props} lpcLabwareInfo={aLwInfo} />
          </ListAccordion>
        ))}
      </ListTable>
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  width: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    margin-bottom: ${SPACING.spacing80};
  }
`

const LOCATION_COLUMN_STYLE = css`
  padding-right: 3.5rem;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding-right: 0;
  }
`

const OFFSET_COLUMN_STYLE = css`
  padding-right: 6.438rem;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding-right: 0;
  }
`

function TableHeaders(): ReactNode {
  const { t } = useTranslation('protocol_setup')

  return (
    <Flex css={TABLE_HEADER_CONTAINER_STYLE}>
      <StyledText
        css={TABLE_HEADER_COLUMN_ONE_TEXT_STYLE}
        desktopStyle="bodyDefaultRegular"
      >
        {t('labware_type')}
      </StyledText>
      <StyledText
        css={TABLE_HEADER_COLUMN_TWO_TEXT_STYLE}
        desktopStyle="bodyDefaultRegular"
      >
        {t('total_offsets')}
      </StyledText>
    </Flex>
  )
}

const TABLE_HEADER_CONTAINER_STYLE = css`
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: 0 ${SPACING.spacing12};
  gap: ${SPACING.spacing24};
`

const TABLE_HEADER_COLUMN_ONE_TEXT_STYLE = css`
  color: ${COLORS.grey60};
`

const TABLE_HEADER_COLUMN_TWO_TEXT_STYLE = css`
  color: ${COLORS.grey60};
  padding-right: 4rem;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding-right: 7.5rem;
  }
`
