import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
  Tag,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'

// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import {
  getAllWellContentsAtFrame,
  getMissingTips,
} from '/app/pages/Desktop/Protocols/ProtocolVisualization/utils'

import styles from './sourcelabwarecontainer.module.css'
import { getWellFillFromWellContents } from './utils/getWellFillFromWellContents'

import type { Liquid } from '@opentrons/shared-data'
import type {
  ContentsByWell,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'

interface SourceLabwareContainerProps {
  slotId: string | null
  displayName: string | null
  labwareId: string | null
  robotState: RobotState
  liquids: Liquid[]
  invariantContext: InvariantContext
}
export function SourceLabwareContainer({
  slotId,
  displayName,
  labwareId,
  robotState,
  liquids,
  invariantContext,
}: SourceLabwareContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')

  if (labwareId == null) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Tag text={t('source_labware')} type="default" shrinkToContent />
          <RobotInfoLabel deckLabel={slotId ?? ''} />
        </div>
        <div className={styles.subheader}>
          <StyledText desktopStyle="captionSemiBold">
            {displayName ?? ''}
          </StyledText>
        </div>
        <div className={styles.main_content}></div>
      </div>
    )
  }

  const labwareDef = invariantContext.labwareEntities[labwareId]?.def

  if (labwareDef == null) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Tag text={t('source_labware')} type="default" shrinkToContent />
          <RobotInfoLabel deckLabel={slotId ?? ''} />
        </div>
        <div className={styles.subheader}>
          <StyledText desktopStyle="captionSemiBold">
            {displayName ?? ''}
          </StyledText>
        </div>
        <div className={styles.main_content}></div>
      </div>
    )
  }

  const labwareViewBox = getLabwareViewBox(labwareDef)

  const liquidDisplayColors = Object.fromEntries(
    liquids.map(liquid => [liquid.id, liquid.displayColor ?? COLORS.grey40])
  )

  const allWellContentsForActiveItem = getAllWellContentsAtFrame(
    robotState.liquidState,
    labwareDef
  )

  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[labwareId]
      : null

  const wellFill = getWellFillFromWellContents(
    wellContents as ContentsByWell,
    liquidDisplayColors
  )

  const missingTips = getMissingTips(robotState.tipState, labwareId)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('source_labware')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={slotId ?? ''} />
      </div>
      <div className={styles.subheader}>
        <StyledText desktopStyle="captionSemiBold">
          {displayName ?? ''}
        </StyledText>
      </div>
      <div className={styles.main_content}>
        <RobotWorkSpace
          key={labwareId}
          width="100%"
          viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
        >
          {() => (
            <g>
              <LabwareRender
                definition={labwareDef}
                positioningMode="passThrough"
                wellFill={wellFill}
                missingTips={missingTips}
              />
            </g>
          )}
        </RobotWorkSpace>
      </div>
    </div>
  )
}
