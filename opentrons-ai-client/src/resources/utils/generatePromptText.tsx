import type { EntityData } from '../types'

export const generatePromptTextForModel = (entityData: EntityData): string => {
  return `${t('create_protocol_prompt_robot', { robotType })}\n${t(
    'application_title'
  )}:\n${scientificApplication}\n\n${t('description')}:\n${description}\n\n${t(
    'pipette_mounts'
  )}:\n\n${pipetteMounts}${flexGripper}\n\n${t(
    'modules_title'
  )}:\n${modules}\n\n${t('labware_section_title')}:\n${labwares}\n\n${t(
    'liquid_section_title'
  )}:\n${liquids}\n\n${t('steps_section_title')}:\n${steps}\n`
}

export const generatePromptTextForUI = (entityData: EntityData): string => {
  const {
    robotType,
    description,
    scientificApplication,
    pipettes,
    gripper,
    modules,
    labware,
    liquid,
    steps,
    t,
  } = entityData

  const robotType = t(robot)
  const scientificApplication = `- ${t(
    values.application.scientificApplication
  )}`
  const description = `- ${values.application.description}`

  // we need to do this nonsense to convert pipette names to api load names
  // this data does not yet live in  pipette defs, but hopefully aill within 6 months
  // of writing this comment. https://opentrons.atlassian.net/browse/EXEC-1426
  let leftPipetteApiLoadName: string | null = null
  let rightPipetteApiLoadName: string | null = null

  if (values.instruments.pipettes === TWO_PIPETTES) {
    const leftPipetteSpecs = getPipetteSpecsV2(
      values.instruments.leftPipette as PipetteName
    )
    const rightPipetteSpecs = getPipetteSpecsV2(
      values.instruments.rightPipette as PipetteName
    )
    if (leftPipetteSpecs != null) {
      leftPipetteApiLoadName = getFlexNameConversion(leftPipetteSpecs)
    }

    if (rightPipetteSpecs != null) {
      rightPipetteApiLoadName = getFlexNameConversion(rightPipetteSpecs)
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
      : [values.instruments.pipettes]

  // this is what you want to change
  const pipetteMounts =
    values.instruments.pipettes === TWO_PIPETTES
      ? [
          values.instruments.leftPipette !== NO_PIPETTES &&
            `- ${
              getPipetteSpecsV2(values.instruments.leftPipette as PipetteName)
                ?.displayName
            } ${t('mounted_left')}`,
          values.instruments.rightPipette !== NO_PIPETTES &&
            `- ${
              getPipetteSpecsV2(values.instruments.rightPipette as PipetteName)
                ?.displayName
            } ${t('mounted_right')}`,
        ]
          .filter(Boolean)
          .join('\n')
      : `- ${t(values.instruments.pipettes)}`
  const flexGripper =
    values.instruments.flexGripper === FLEX_GRIPPER &&
    values.instruments.robot === OPENTRONS_FLEX
      ? `\n- ${t('with_flex_gripper')}`
      : ''
  const modules = values.modules
    .map(
      module =>
        `- ${module.name}${
          module.adapter?.name != null ? ` with ${module.adapter.name}` : ''
        }`
    )
    .join('\n')
  const labwares = values.labwares
    .map(
      labware =>
        `- ${getLabwareDisplayName(defs[labware.labwareURI])} x ${
          labware.count
        }`
    )
    .join('\n')
  const liquids = values.liquids.map(liquid => `- ${liquid}`).join('\n')
  const steps = Array.isArray(values.steps)
    ? values.steps.map(step => `- ${step}`).join('\n')
    : values.steps

  const prompt = `${t('create_protocol_prompt_robot', { robotType })}\n${t(
    'application_title'
  )}:\n${scientificApplication}\n\n${t('description')}:\n${description}\n\n${t(
    'pipette_mounts'
  )}:\n\n${pipetteMounts}${flexGripper}\n\n${t(
    'modules_title'
  )}:\n${modules}\n\n${t('labware_section_title')}:\n${labwares}\n\n${t(
    'liquid_section_title'
  )}:\n${liquids}\n\n${t('steps_section_title')}:\n${steps}\n`
  return `${t('create_protocol_prompt_robot', { robotType })}\n${t(
    'application_title'
  )}:\n${scientificApplication}\n\n${t('description')}:\n${description}\n\n${t(
    'pipette_mounts'
  )}:\n\n${pipetteMounts}${flexGripper}\n\n${t(
    'modules_title'
  )}:\n${modules}\n\n${t('labware_section_title')}:\n${labwares}\n\n${t(
    'liquid_section_title'
  )}:\n${liquids}\n\n${t('steps_section_title')}:\n${steps}\n`
}
