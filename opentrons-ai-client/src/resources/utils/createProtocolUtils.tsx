import {
  getFlexNameConversion,
  getLabwareDisplayName,
  getPipetteSpecsV2,
  splitLabwareDefURI,
} from '@opentrons/shared-data'

import { OTHER } from '/ai-client/components/organisms/ApplicationSection'
import {
  FLEX_GRIPPER,
  NINETY_SIX_CHANNEL_PIPETTE,
  NO_PIPETTES,
  OPENTRONS_FLEX,
  OPENTRONS_OT2,
  ROBOT_FIELD_NAME,
  TWO_PIPETTES,
} from '/ai-client/components/organisms/InstrumentsSection'

import { getOnlyLatestDefs } from './labware'

import type { UseFormWatch } from 'react-hook-form'
import type { PipetteName } from '@opentrons/shared-data'
import type { CreateProtocolFormData } from '/ai-client/pages/CreateProtocol'
import type { CreatePrompt } from '/ai-client/resources/types'

export function generatePromptPreviewApplicationItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const {
    application: { scientificApplication, otherApplication, description },
  } = watch()

  const scientificOrOtherApplication =
    scientificApplication === OTHER
      ? otherApplication
      : scientificApplication !== ''
        ? t(scientificApplication)
        : ''

  return [
    scientificOrOtherApplication !== '' && scientificOrOtherApplication,
    description !== '' && description,
  ].filter(Boolean)
}

export function generatePromptPreviewInstrumentItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const {
    instruments: {
      robot,
      pipettes,
      leftPipette,
      rightPipette,
      ninetySixChannelPipette,
      flexGripper,
    },
  } = watch()

  const items = []

  robot !== '' && items.push(t(robot))

  if (pipettes === TWO_PIPETTES || robot === OPENTRONS_OT2) {
    leftPipette !== '' &&
      leftPipette !== NO_PIPETTES &&
      items.push(getPipetteSpecsV2(leftPipette as PipetteName)?.displayName)

    rightPipette !== '' &&
      rightPipette !== NO_PIPETTES &&
      items.push(getPipetteSpecsV2(rightPipette as PipetteName)?.displayName)
  } else if (pipettes === NINETY_SIX_CHANNEL_PIPETTE) {
    ninetySixChannelPipette !== '' && items.push(t(ninetySixChannelPipette))
  } else {
    items.push(pipettes !== '' && t(pipettes))
  }

  if (robot === OPENTRONS_FLEX && flexGripper === FLEX_GRIPPER) {
    items.push(t(flexGripper))
  }

  return items.filter(Boolean)
}

export function generatePromptPreviewModulesItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { modules } = watch()

  if (modules === undefined || modules?.length === 0) return []

  const items = modules?.map(module =>
    module.adapter === undefined || module.adapter?.name === ''
      ? module.name
      : `${module.name} with ${module.adapter.name}`
  )

  return items.filter(Boolean)
}

export function generatePromptPreviewFixtureItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { fixtures } = watch()

  if (fixtures === undefined || fixtures?.length === 0) return []

  const items = fixtures?.map(fixture => fixture.name)

  return items.filter(Boolean)
}

export function generatePromptPreviewLabwareLiquidsItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { labwares, liquids } = watch()

  const items: string[] = []
  const defs = getOnlyLatestDefs()

  // Add all labware items
  labwares?.forEach(labware => {
    items.push(
      `${labware.count} x ${getLabwareDisplayName(defs[labware.labwareURI])}`
    )
  })

  // Only add liquids if there are any
  if (
    liquids &&
    liquids.length > 0 &&
    liquids.some(liquid => liquid.trim() !== '')
  ) {
    // Add a special item that will force a line break by taking up 100% width
    items.push('__LINE_BREAK__')

    // Add all liquid items
    liquids.forEach(liquid => {
      if (liquid.trim() !== '') {
        items.push(liquid)
      }
    })
  }

  return items.filter(Boolean)
}

export function generatePromptPreviewStepsItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { steps } = watch()

  if (steps === undefined || steps?.length === 0) return []

  if (typeof steps === 'string') {
    // If string is empty, return empty array
    if (steps.trim() === '') return []

    // Split the string by line
    const lines = steps.split('\n')
    const result: string[] = []
    let currentStep = ''
    let isFirstLineInCurrentStep = true
    let lastLineWasNumberedStep = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Check if this line starts a new numbered step (like "1." or "2)")
      const isNumberedStep = /^\d+[.)]/.test(line)

      // Check if this line is a bullet point
      const isBulletPoint = /^[-*•]/.test(line)

      // A new step starts if:
      // 1. It's a numbered step OR
      // 2. It's a bullet point that's not immediately after a numbered step OR
      // 3. It's the first line
      const isNewStepLine =
        isNumberedStep ||
        (isBulletPoint && !lastLineWasNumberedStep) ||
        (i === 0 && line !== '')

      // Update tracking for whether the last line was a numbered step
      // This helps us keep dashed points with their parent numbered step
      if (isNumberedStep) {
        lastLineWasNumberedStep = true
      } else if (!isBulletPoint) {
        lastLineWasNumberedStep = false
      }

      // If empty line and we have content, finalize current step
      if (line === '' && currentStep !== '') {
        result.push(currentStep.trim())
        currentStep = ''
        isFirstLineInCurrentStep = true
        lastLineWasNumberedStep = false
        continue
      }

      // Skip empty lines otherwise
      if (line === '') continue

      // Start a new step or add to current step
      if (isNewStepLine) {
        // If we already have content, push it as a completed step
        if (currentStep !== '') {
          result.push(currentStep.trim())
        }
        currentStep = line
        isFirstLineInCurrentStep = false
      } else {
        // This is a continuation of the current step (created with Shift+Enter)
        // Add a line break to preserve formatting
        if (!isFirstLineInCurrentStep) {
          currentStep += '\n' + line
        } else {
          currentStep += line
          isFirstLineInCurrentStep = false
        }
      }
    }

    // Add the last step if there's content
    if (currentStep.trim() !== '') {
      result.push(currentStep.trim())
    }

    return result
  }

  return steps.filter(Boolean)
}

export function generatePromptPreviewRuntimeParametersItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { runtime_parameters } = watch()
  const robotType = watch(ROBOT_FIELD_NAME)

  // Only show in preview if robot is Flex
  if (robotType !== OPENTRONS_FLEX || !runtime_parameters) {
    return []
  }

  return [runtime_parameters].filter(Boolean)
}

export function generatePromptPreviewData(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): Array<{
  title: string
  items: string[]
}> {
  return [
    {
      title: t('application_title'),
      items: generatePromptPreviewApplicationItems(watch, t),
    },
    {
      title: t('instruments_title'),
      items: generatePromptPreviewInstrumentItems(watch, t),
    },
    {
      title: t('modules_title'),
      items: generatePromptPreviewModulesItems(watch, t),
    },
    {
      title: t('fixtures_title'),
      items: generatePromptPreviewFixtureItems(watch, t),
    },
    {
      title: t('labware_liquids_title'),
      items: generatePromptPreviewLabwareLiquidsItems(watch, t),
    },
    {
      title: t('runtime_parameters_title'),
      items: generatePromptPreviewRuntimeParametersItems(watch, t),
    },
    {
      title: t('steps_title'),
      items: generatePromptPreviewStepsItems(watch, t),
    },
  ]
}

export function generateChatPrompt(
  values: CreateProtocolFormData,
  t: any,
  setCreateProtocolChatAtom: (
    args_0: CreatePrompt | ((prev: CreatePrompt) => CreatePrompt)
  ) => void
): string {
  const robotType = t(values.instruments.robot)
  const scientificApplication = `- ${t(
    values.application.scientificApplication
  )}`
  const description = `- ${values.application.description}`

  // we need to do this nonsense to convert pipette names to api load names
  // this data does not yet live in  pipette defs, but hopefully aill within 6 months
  // of writing this comment. https://opentrons.atlassian.net/browse/EXEC-1426
  let leftPipetteApiLoadName: string | null = null
  let rightPipetteApiLoadName: string | null = null

  const leftPipetteName = values.instruments.leftPipette
  const rightPipetteName = values.instruments.rightPipette

  if (leftPipetteName && leftPipetteName !== NO_PIPETTES) {
    const leftPipetteSpecs = getPipetteSpecsV2(leftPipetteName as PipetteName)
    if (leftPipetteSpecs != null) {
      // Only convert to Flex name if the robot is Flex
      if (values.instruments.robot === OPENTRONS_FLEX) {
        leftPipetteApiLoadName = getFlexNameConversion(leftPipetteSpecs)
      }
    }
  }
  if (rightPipetteName && rightPipetteName !== NO_PIPETTES) {
    const rightPipetteSpecs = getPipetteSpecsV2(rightPipetteName as PipetteName)
    if (rightPipetteSpecs != null) {
      // Only convert to Flex name if the robot is Flex
      if (values.instruments.robot === OPENTRONS_FLEX) {
        rightPipetteApiLoadName = getFlexNameConversion(rightPipetteSpecs)
      }
    }
  }
  const leftPipettePromptName =
    leftPipetteApiLoadName ?? values.instruments.leftPipette
  const rightPipettePromptName =
    rightPipetteApiLoadName ?? values.instruments.rightPipette

  const mounts: string[] =
    values.instruments.pipettes === TWO_PIPETTES
      ? [
          values.instruments.leftPipette !== NO_PIPETTES
            ? `left pipette ${leftPipettePromptName}`
            : '',
          values.instruments.rightPipette !== NO_PIPETTES
            ? `right pipette ${rightPipettePromptName}`
            : '',
        ].filter(Boolean)
      : values.instruments.pipettes === NINETY_SIX_CHANNEL_PIPETTE
        ? [values.instruments.ninetySixChannelPipette]
        : [values.instruments.pipettes]

  const pipetteMounts =
    values.instruments.pipettes === TWO_PIPETTES
      ? [
          values.instruments.leftPipette !== NO_PIPETTES &&
            `- ${leftPipettePromptName} ${t('mounted_left')}`,
          values.instruments.rightPipette !== NO_PIPETTES &&
            `- ${rightPipettePromptName} ${t('mounted_right')}`,
        ]
          .filter(Boolean)
          .join('\n')
      : values.instruments.pipettes === NINETY_SIX_CHANNEL_PIPETTE
        ? `- ${t(values.instruments.ninetySixChannelPipette)}`
        : `- ${t(values.instruments.pipettes)}`
  const flexGripper =
    values.instruments.flexGripper === FLEX_GRIPPER &&
    values.instruments.robot === OPENTRONS_FLEX
      ? `\n- ${t('with_flex_gripper')}`
      : ''

  const modules = values.modules
    .map(
      module =>
        `- ${module.model}${
          module.adapter?.name != null ? ` with ${module.adapter.value}` : ''
        }`
    )
    .join('\n')

  const fixtures = values.fixtures
    .map(fixture => `- ${fixture.name}`)
    .join('\n')

  const labwares = values.labwares
    .map(
      labware =>
        `- ${splitLabwareDefURI(labware.labwareURI).loadName} x ${
          labware.count
        }`
    )
    .join('\n')

  const liquids = values.liquids.map(liquid => `- ${liquid}`).join('\n')

  const steps = Array.isArray(values.steps)
    ? values.steps.map(step => `- ${step}`).join('\n')
    : values.steps

  const moduleSection =
    values.modules.length > 0 ? `\n\n${t('modules_title')}:\n${modules}` : ''

  const fixtureSection =
    values.fixtures.length > 0 ? `\n\n${t('fixtures_title')}:\n${fixtures}` : ''

  const runtimeParametersSection =
    values.instruments.robot === OPENTRONS_FLEX && values.runtime_parameters
      ? `\n\n${t(
          'runtime_parameters_title'
        )}:\n- ${values.runtime_parameters.replace(/\n/g, '\n- ')}`
      : ''

  const prompt = `${t('create_protocol_prompt_robot', { robotType }) + '\n'}


${t('application_title')}:\n${scientificApplication}

${t('description')}:\n${description}

${t(
  'pipette'
)}:\n\n${pipetteMounts}${flexGripper}${moduleSection}${fixtureSection}

\n${t('labware_section_title')}:\n${labwares}

\n${t('liquid_section_title')}:\n${liquids}${runtimeParametersSection}

\n${t('steps_section_title')}:\n${steps}
`

  setCreateProtocolChatAtom({
    prompt,
    regenerate: false,
    scientificApplicationType:
      values.application.scientificApplication === OTHER
        ? values.application.otherApplication
        : values.application.scientificApplication,
    description,
    robots: values.instruments.robot,
    mounts,
    flexGripper: values.instruments.flexGripper === FLEX_GRIPPER,
    modules: values.modules.map(
      module =>
        `${module.model}${
          module.adapter?.name != null
            ? `, adapter ${module.adapter?.value}`
            : ''
        }`
    ),
    fixtures: values.fixtures.map(fixture => fixture.name),
    labware: values.labwares.map(
      labware => `${labware.labwareURI}, quantity: ${labware.count}`
    ),
    liquids: values.liquids,
    runtimeParameters: values.runtime_parameters,
    steps: Array.isArray(values.steps) ? values.steps : [values.steps],
  })

  return prompt
}
