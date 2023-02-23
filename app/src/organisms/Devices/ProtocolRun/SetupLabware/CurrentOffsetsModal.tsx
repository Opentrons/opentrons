import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
  getModuleDisplayName,
  RunTimeCommand,
} from '@opentrons/shared-data'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  Link,
  useHoverTooltip,
  TOOLTIP_LEFT,
} from '@opentrons/components'

import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../redux/config'
import { ModalHeader, ModalShell } from '../../../../molecules/Modal'
import { PrimaryButton } from '../../../../atoms/buttons'
import { Tooltip } from '../../../../atoms/Tooltip'
import { LabwareOffsetTabs } from '../../../LabwareOffsetTabs'
import { OffsetVector } from '../../../../molecules/OffsetVector'
import { PythonLabwareOffsetSnippet } from '../../../../molecules/PythonLabwareOffsetSnippet'
import { useLPCDisabledReason } from '../../hooks'
import { getLatestCurrentOffsets } from './utils'

import type { LabwareOffset } from '@opentrons/api-client'

const OffsetTable = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing1};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const OffsetTableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  padding: ${SPACING.spacing2};
`
const OffsetTableRow = styled('tr')`
  background-color: ${COLORS.fundamentalsBackground};
  padding: ${SPACING.spacing3};
`

const OffsetTableDatum = styled('td')`
  padding: ${SPACING.spacing3};
  white-space: break-spaces;
  text-overflow: wrap;
`

interface CurrentOffsetsModalProps {
  currentOffsets: LabwareOffset[]
  commands: RunTimeCommand[]
  runId: string
  robotName: string
  onCloseClick: () => void
  handleRelaunchLPC: () => void
}
export function CurrentOffsetsModal(
  props: CurrentOffsetsModalProps
): JSX.Element {
  const {
    currentOffsets,
    commands,
    runId,
    robotName,
    onCloseClick,
    handleRelaunchLPC,
  } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const defsByURI = getLoadedLabwareDefinitionsByUri(commands)
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const lpcDisabledReason = useLPCDisabledReason(robotName, runId)
  const latestCurrentOffsets = getLatestCurrentOffsets(currentOffsets)

  const TableComponent = (
    <OffsetTable>
      <thead>
        <tr>
          <OffsetTableHeader>{t('location')}</OffsetTableHeader>
          <OffsetTableHeader>{t('labware')}</OffsetTableHeader>
          <OffsetTableHeader>{t('labware_offset_data')}</OffsetTableHeader>
        </tr>
      </thead>
      <tbody>
        {latestCurrentOffsets.map(offset => {
          const labwareDisplayName =
            offset.definitionUri in defsByURI
              ? getLabwareDisplayName(defsByURI[offset.definitionUri])
              : offset.definitionUri
          return (
            <OffsetTableRow key={offset.id}>
              <OffsetTableDatum>
                {t('slot', { slotName: offset.location.slotName })}
                {offset.location.moduleModel != null
                  ? ` - ${getModuleDisplayName(offset.location.moduleModel)}`
                  : null}
              </OffsetTableDatum>
              <OffsetTableDatum>{labwareDisplayName}</OffsetTableDatum>
              <OffsetTableDatum>
                <OffsetVector {...offset.vector} />
              </OffsetTableDatum>
            </OffsetTableRow>
          )
        })}
      </tbody>
    </OffsetTable>
  )

  const JupyterSnippet = (
    <PythonLabwareOffsetSnippet
      mode="jupyter"
      labwareOffsets={null} // todo (jb 2-15-23) update the values passed in as part of the snippet updates
      protocol={null} // todo (jb 2-15-23) update the values passed in as part of the snippet updates
    />
  )
  const CommandLineSnippet = (
    <PythonLabwareOffsetSnippet
      mode="cli"
      labwareOffsets={null} // todo (jb 2-15-23) update the values passed in as part of the snippet updates
      protocol={null} // todo (jb 2-15-23) update the values passed in as part of the snippet updates
    />
  )
  return (
    <ModalShell
      maxWidth="40rem"
      header={
        <ModalHeader title={t('applied_offset_data')} onClose={onCloseClick} />
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing6}
      >
        {isLabwareOffsetCodeSnippetsOn ? (
          <LabwareOffsetTabs
            TableComponent={TableComponent}
            JupyterComponent={JupyterSnippet}
            CommandLineComponent={CommandLineSnippet}
          />
        ) : (
          TableComponent
        )}
        <Flex
          width="100%"
          marginTop={SPACING.spacing6}
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing3}
        >
          <Link
            css={TYPOGRAPHY.linkPSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={onCloseClick}
            role="button"
          >
            {t('shared:cancel')}
          </Link>
          <PrimaryButton
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={handleRelaunchLPC}
            disabled={lpcDisabledReason !== null}
            {...targetProps}
          >
            {t('run_labware_position_check')}
          </PrimaryButton>
          {lpcDisabledReason !== null ? (
            <Tooltip tooltipProps={tooltipProps}>{lpcDisabledReason}</Tooltip>
          ) : null}
        </Flex>
      </Flex>
    </ModalShell>
  )
}
