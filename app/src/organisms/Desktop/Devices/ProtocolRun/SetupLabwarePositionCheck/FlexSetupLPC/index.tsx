import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  SPACING,
} from '@opentrons/components'

import { LPCFlows } from '/app/organisms/LabwarePositionCheck'
import { getIsLabwareOffsetCodeSnippetsOn } from '/app/redux/config'
import { selectLabwareOffsetsToAddToRun } from '/app/redux/protocol-runs'

import { LPCOffsetsSnippets } from './LPCOffsetsSnippets'
import { LPCSetupFlexBtns } from './LPCSetupFlexBtns'
import { LPCSetupOffsetsTable } from './LPCSetupOffsetsTable'

import type { ReactNode } from 'react'
import type { State } from '/app/redux/types'
import type { SetupLabwarePositionCheckProps } from '..'

export function FlexSetupLPC(props: SetupLabwarePositionCheckProps): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const { launchLPC, showLPC, lpcProps } = props.lpcUtils
  const hasLpcState = useSelector(
    (state: State) => state.protocolRuns?.[props.runId]?.lpc != null
  )
  const { protocolData } = useSelector(
    (state: State) => state.protocolRuns[props.runId]?.lpc
  ) ?? { protocolData: undefined }
  const lwOffsetsForRun = useSelector(
    selectLabwareOffsetsToAddToRun(props.runId)
  )
  const snippetsEnabled = useSelector(getIsLabwareOffsetCodeSnippetsOn)

  const showSnippets =
    snippetsEnabled && protocolData != null && lwOffsetsForRun != null

  if (!hasLpcState) {
    return (
      <InfoScreen
        iconName="ot-spinner"
        content={t('loading_labware_offsets')}
        height="auto"
      />
    )
  }

  return (
    <Flex css={CONTAINER_STYLE}>
      <LPCSetupOffsetsTable {...props} />
      {showSnippets && (
        <LPCOffsetsSnippets
          {...props}
          protocolData={protocolData}
          lwOffsetsForRun={lwOffsetsForRun}
        />
      )}
      <LPCSetupFlexBtns {...props} launchLPC={launchLPC} />
      {showLPC && <LPCFlows {...lpcProps} />}
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  margin-top: ${SPACING.spacing16};
  grid-gap: ${SPACING.spacing16};
`
