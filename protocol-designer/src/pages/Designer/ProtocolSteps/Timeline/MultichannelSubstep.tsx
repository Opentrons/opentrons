import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  RobotInfoLabel,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import { Substep } from './Substep'
import { formatVolume } from './utils'

import type { ReactNode } from 'react'
import type { AdditionalEquipmentName } from '@opentrons/step-generation'
import type {
  StepItemSourceDestRow,
  SubstepIdentifier,
} from '/protocol-designer/steplist'

interface MultichannelSubstepProps {
  trashName: AdditionalEquipmentName | null
  rowGroup: StepItemSourceDestRow[]
  stepId: string
  substepIndex: number
  selectSubstep: (substepIdentifier: SubstepIdentifier) => void
  highlighted?: boolean
  isSameLabware?: boolean
}

export function MultichannelSubstep(
  props: MultichannelSubstepProps
): ReactNode {
  const {
    rowGroup,
    stepId,
    selectSubstep,
    substepIndex,
    trashName,
    isSameLabware,
  } = props
  const { t } = useTranslation(['application', 'protocol_steps', 'shared'])
  const [collapsed, setCollapsed] = useState<Boolean>(true)
  const handleToggleCollapsed = (): void => {
    setCollapsed(!collapsed)
  }

  const firstChannelSource = rowGroup[0].source
  const lastChannelSource = rowGroup[rowGroup.length - 1].source
  const sourceWellRange = `${
    firstChannelSource ? firstChannelSource.well : ''
  }:${lastChannelSource ? lastChannelSource.well : ''}`
  const firstChannelDest = rowGroup[0].dest
  const lastChannelDest = rowGroup[rowGroup.length - 1].dest
  const destWellRange = `${
    firstChannelDest ? (firstChannelDest.well ?? t('shared:trash')) : ''
  }:${lastChannelDest ? lastChannelDest.well : ''}`

  let titleCopy = t('protocol_steps:aspirated')
  let deckLabel = <RobotInfoLabel deckLabel={sourceWellRange} />
  if (firstChannelSource != null && firstChannelDest != null) {
    titleCopy = t('protocol_steps:mix')
  } else if (firstChannelSource == null && firstChannelDest != null) {
    titleCopy = t('protocol_steps:dispensed')
    deckLabel = <RobotInfoLabel deckLabel={destWellRange} />
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      width="100%"
      onMouseEnter={() => {
        selectSubstep({ stepId, substepIndex })
      }}
      onMouseLeave={() => {
        selectSubstep(null)
      }}
    >
      <ListItem type="default">
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          padding={SPACING.spacing12}
          width="100%"
          height={collapsed ? '3rem' : 'auto'}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <Flex
              gridGap={SPACING.spacing4}
              paddingRight={SPACING.spacing12}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {titleCopy}
              </StyledText>
              <Tag
                text={`${formatVolume(rowGroup[0].volume)} ${t(
                  'units.microliter'
                )}`}
                type="default"
                shrinkToContent
              />
              <StyledText desktopStyle="bodyDefaultRegular">
                {firstChannelSource != null && firstChannelDest == null
                  ? t('protocol_steps:from')
                  : t('protocol_steps:into')}
              </StyledText>
              {deckLabel}
            </Flex>
            <Btn onClick={handleToggleCollapsed}>
              <Icon
                name={collapsed ? 'chevron-down' : 'chevron-up'}
                size="1.5rem"
              />
            </Btn>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {!collapsed ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingTop={SPACING.spacing8}
                gridGap={SPACING.spacing8}
              >
                <StyledText
                  color={COLORS.grey60}
                  desktopStyle="bodyDefaultRegular"
                >
                  {t('protocol_steps:individual_wells')}
                </StyledText>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                  alignItems={ALIGN_CENTER}
                >
                  {rowGroup.map((row, rowKey) => {
                    return (
                      <Substep
                        isNested
                        trashName={trashName}
                        key={rowKey}
                        volume={row.volume}
                        source={row.source}
                        dest={row.dest}
                        stepId={stepId}
                        substepIndex={substepIndex}
                        isSameLabware={isSameLabware}
                      />
                    )
                  })}
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </ListItem>
    </Flex>
  )
}
