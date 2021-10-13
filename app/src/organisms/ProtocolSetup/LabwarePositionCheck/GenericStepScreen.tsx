import * as React from 'react'
import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
} from '@opentrons/components'
import { LabwarePositionCheckStepDetail } from './LabwarePositionCheckStepDetail'
import { SectionList } from './SectionList'
import { useIntroInfo } from './hooks'
import type { LabwarePositionCheckStep } from './types'

interface GenericStepScreenProps {
  selectedStep: LabwarePositionCheckStep
  setCurrentLabwareCheckStep: (stepNumber: number) => void
}
export const GenericStepScreen = (
  props: GenericStepScreenProps
): JSX.Element | null => {
  const introInfo = useIntroInfo()
  const [sectionIndex] = React.useState<number>(0)
  if (introInfo == null) return null
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo
  return (
    <Box margin={SPACING_3}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <SectionList
          primaryPipetteMount={primaryPipetteMount}
          secondaryPipetteMount={secondaryPipetteMount}
          sections={sections}
          currentSection={sections[sectionIndex]}
          completedSections={[sections[sectionIndex - 1]]}
        />
        <Box width="60%" padding={SPACING_3}>
          <LabwarePositionCheckStepDetail selectedStep={props.selectedStep} />
        </Box>
      </Flex>
    </Box>
  )
}
