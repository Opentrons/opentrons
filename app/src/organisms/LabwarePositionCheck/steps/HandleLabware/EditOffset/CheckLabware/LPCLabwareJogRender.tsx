import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  CenterLabwareInSlot,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  PipetteRender,
  RESPONSIVENESS,
  RobotWorkSpace,
  SPACING,
  TEXT_ALIGN_CENTER,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'

import levelProbeWithLabware from '/app/assets/images/lpc_level_probe_with_labware.svg'
import levelProbeWithTip from '/app/assets/images/lpc_level_probe_with_tip.svg'
import {
  selectActivePipette,
  selectIsSelectedLwTipRack,
  selectSelectedLwDef,
} from '/app/redux/protocol-runs'

import type { ReactNode } from 'react'
import type { EditOffsetContentProps } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/EditOffset'

// TODO(jh, 03-12-25): Standardize viewboxes.
const DECK_MAP_VIEWBOX = '-10 -10 150 105'

export function LPCLabwareJogRender({
  runId,
}: EditOffsetContentProps): ReactNode {
  const pipetteName =
    useSelector(selectActivePipette(runId))?.pipetteName ?? 'p1000_single'
  const itemLwDef = useSelector(selectSelectedLwDef(runId))!

  return (
    <Flex css={RENDER_CONTAINER_STYLE}>
      <RobotWorkSpace viewBox={DECK_MAP_VIEWBOX}>
        {() => (
          <CenterLabwareInSlot definition={itemLwDef}>
            <LabwareRender
              definition={itemLwDef}
              positioningMode="passThrough"
              wellStroke={{ A1: COLORS.blue50 }}
              wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE}
              highlightedWellLabels={{ wells: ['A1'] }}
              labwareStroke={COLORS.black90}
              wellLabelColor={COLORS.black90}
            />
            <PipetteRender
              labwareDef={itemLwDef}
              pipetteName={pipetteName}
              usingMetalProbe={true}
            />
          </CenterLabwareInSlot>
        )}
      </RobotWorkSpace>
      <LevelWithLabware runId={runId} />
    </Flex>
  )
}

const RENDER_CONTAINER_STYLE = css`
  flex: 1;
  align-items: ${ALIGN_CENTER};
`

function LevelWithLabware({ runId }: { runId: string }): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const isLwTiprack = useSelector(selectIsSelectedLwTipRack(runId))

  const levelSrc = isLwTiprack ? levelProbeWithTip : levelProbeWithLabware

  return (
    <Flex css={LEVEL_CONTAINER_STYLE}>
      <img
        css={isLwTiprack ? TIP_RACK_IMAGE_STYLE : LABWARE_IMAGE_STYLE}
        src={levelSrc}
        alt={`level with ${isLwTiprack ? 'tip' : 'labware'}`}
      />
      {!isLwTiprack && (
        <Flex css={LEVEL_LABWARE_COPY_STYLE}>
          {t('align_to_top_of_labware')}
        </Flex>
      )}
    </Flex>
  )
}

const LEVEL_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  gap: ${SPACING.spacing16};
`

const TIP_RACK_IMAGE_STYLE = css`
  width: 89px;
  height: 145px;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 229px;
  }
`

const LABWARE_IMAGE_STYLE = css`
  width: 89px;
  height: 125px;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 89px;
    height: 145px;
  }
`

const LEVEL_LABWARE_COPY_STYLE = css`
  width: 93px;
  height: 57px;

  text-align: ${TEXT_ALIGN_CENTER};
  color: ${COLORS.blue50};
  font-weight: 700;
  font-size: 16px;
  line-height: 100%;
`
