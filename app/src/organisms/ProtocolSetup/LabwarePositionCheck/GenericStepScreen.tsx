import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
  SPACING_4,
} from '@opentrons/components'
import { LabwarePositionCheckStepDetail } from './LabwarePositionCheckStepDetail'
import { SectionList } from './SectionList'
import { useIntroInfo, useLabwareIdsBySection } from './hooks'
import { DeckMap } from './DeckMap'
import type { LabwarePositionCheckStep } from './types'

interface GenericStepScreenProps {
  selectedStep: LabwarePositionCheckStep
  setCurrentLabwareCheckStep: (stepNumber: number) => void
}
export const GenericStepScreen = (
  props: GenericStepScreenProps
): JSX.Element | null => {
  const introInfo = useIntroInfo()
  const labwareIdsBySection = useLabwareIdsBySection()
  const [sectionIndex] = React.useState<number>(0)
  if (introInfo == null) return null
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo
  const labwareIdsToHighlight = labwareIdsBySection[sections[sectionIndex]]

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      margin={SPACING_3}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex marginLeft={SPACING_4}>
          <SectionList
            primaryPipetteMount={primaryPipetteMount}
            secondaryPipetteMount={secondaryPipetteMount}
            sections={sections}
            currentSection={sections[sectionIndex]}
            completedSections={[sections[sectionIndex - 1]]}
          />
        </Flex>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <DeckMap
            labwareIdsToHighlight={labwareIdsToHighlight}
            completedLabwareIdSections={
              labwareIdsBySection[sections[sectionIndex - 1]]
            }
          />
        </Flex>
      </Flex>
      <Flex flex={'1 1 60%'} padding={SPACING_3}>
        <LabwarePositionCheckStepDetail selectedStep={props.selectedStep} />
      </Flex>
    </Flex>
  )
}
