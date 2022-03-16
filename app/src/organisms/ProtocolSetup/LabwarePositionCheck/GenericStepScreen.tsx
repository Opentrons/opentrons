import * as React from 'react'
import uniq from 'lodash/uniq'
import isEqual from 'lodash/isEqual'
import {
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  NewPrimaryBtn,
  SPACING_3,
  SPACING_4,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
  ALIGN_FLEX_START,
} from '@opentrons/components'
import { LabwarePositionCheckStepDetail } from './LabwarePositionCheckStepDetail'
import { SectionList } from './SectionList'
import { useIntroInfo, useLabwareIdsBySection, useSteps } from './hooks'
import { DeckMap } from './DeckMap'
import type { Jog } from '../../../molecules/JogControls'
import type { LabwarePositionCheckStep } from './types'

interface GenericStepScreenProps {
  selectedStep: LabwarePositionCheckStep
  ctaText: string
  proceed: () => void
  jog: Jog
  title: string
}
export const GenericStepScreen = (
  props: GenericStepScreenProps
): JSX.Element | null => {
  const introInfo = useIntroInfo()
  const labwareIdsBySection = useLabwareIdsBySection()
  const allSteps = useSteps()
  if (introInfo == null) return null
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo
  const labwareIdsToHighlight = labwareIdsBySection[props.selectedStep.section]
  const currentSectionIndex = sections.findIndex(
    section => section === props.selectedStep.section
  )
  const completedSections = sections.slice(0, currentSectionIndex)
  const selectedStepIndex = allSteps.findIndex(step =>
    isEqual(step, props.selectedStep)
  )
  const completedSteps =
    selectedStepIndex > 0 ? allSteps.slice(0, selectedStepIndex) : []

  const completedLabwareIds = completedSteps.reduce<string[]>(
    (acc, step) => uniq([...acc, step.labwareId]),
    []
  )

  return (
    <Flex margin={SPACING_3} flexDirection={DIRECTION_COLUMN}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_3}
        marginLeft={SPACING_3}
      >
        {props.title}
      </Text>
      <Flex alignItems={ALIGN_FLEX_START} padding={SPACING_3}>
        <Flex flexDirection={DIRECTION_COLUMN} paddingTop={SPACING_3}>
          <Flex marginLeft={SPACING_4}>
            <SectionList
              primaryPipetteMount={primaryPipetteMount}
              secondaryPipetteMount={secondaryPipetteMount}
              sections={sections}
              currentSection={props.selectedStep.section}
              completedSections={completedSections}
            />
          </Flex>
          <Flex justifyContent={JUSTIFY_CENTER} paddingTop={SPACING_3}>
            <DeckMap
              labwareIdsToHighlight={labwareIdsToHighlight}
              completedLabwareIds={completedLabwareIds}
            />
          </Flex>
        </Flex>
        <Flex padding={SPACING_3}>
          <LabwarePositionCheckStepDetail
            selectedStep={props.selectedStep}
            jog={props.jog}
          />
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <NewPrimaryBtn onClick={props.proceed}>{props.ctaText}</NewPrimaryBtn>
      </Flex>
    </Flex>
  )
}
