import mapValues from 'lodash/mapValues'
import { uuid } from '../../utils'
import { getOnlyLatestDefs } from '../../labware-defs'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import { getAdapterAndLabwareSplitInfo } from './utils/getAdapterAndLabwareSplitInfo'
import type {
  LabwareDefinitionsByUri,
  ProtocolFileV6,
} from '@opentrons/shared-data'
import type {
  LoadPipetteCreateCommand,
  LoadModuleCreateCommand,
  LoadLabwareCreateCommand,
  LabwareLocation,
  ProtocolFile,
} from '@opentrons/shared-data/protocol/types/schemaV7'
import type {
  LoadPipetteCreateCommand as LoadPipetteCommandV6,
  LoadModuleCreateCommand as LoadModuleCommandV6,
  LoadLabwareCreateCommand as LoadLabwareCommandV6,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

// NOTE: this migration removes pipettes, labware, and modules as top level keys and adds necessary
// params to the load commands. Also, this migrates previous combined
//  adapter + labware commands to all labware commands and definitions to their commands/definitions split up
//  as well as removing touch_tip commands from labware where touch_tip is incompatible
const PD_VERSION = '7.0.0'
const SCHEMA_VERSION = 7
interface LabwareLocationUpdate {
  [id: string]: string
}

const ADAPTER_LABWARE_COMBO_LOAD_NAMES = [
  'opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep',
  'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat',
  'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt',
  'opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat',
  'opentrons_96_aluminumblock_biorad_wellplate_200ul',
  'opentrons_96_aluminumblock_nest_wellplate_100ul',
]

interface LabwareIdMapping {
  [oldLabwareId: string]: string[]
}

export const migrateFile = (
  appData: ProtocolFileV6<DesignerApplicationData>
): ProtocolFile => {
  const { commands, labwareDefinitions } = appData
  const { pipettes, labware, modules, ...rest } = appData
  const labwareLocationUpdate: LabwareLocationUpdate =
    appData.designerApplication?.data?.savedStepForms[
      INITIAL_DECK_SETUP_STEP_ID
    ].labwareLocationUpdate
  const ingredLocations = appData.designerApplication?.data?.ingredLocations

  const allLatestDefs = getOnlyLatestDefs()

  const getIsAdapter = (labwareId: string): boolean => {
    const labwareEntity = labware[labwareId]
    if (labwareEntity == null) {
      console.error(
        `expected to find labware entity with labwareId ${labwareId} but could not`
      )
      return false
    }
    const loadName =
      labwareDefinitions[labwareEntity.definitionId].parameters.loadName
    return ADAPTER_LABWARE_COMBO_LOAD_NAMES.includes(loadName)
  }

  const mappedLabwareIds = (labwareIds: string[]): LabwareIdMapping => {
    const idMapping: LabwareIdMapping = {}
    labwareIds.forEach(labwareId => {
      if (getIsAdapter(labwareId)) {
        const { labwareUri, adapterUri } = getAdapterAndLabwareSplitInfo(
          labwareId
        )
        const migratedLabwareId = `${uuid()}:${labwareUri}`
        const migratedAdapterId = `${uuid()}:${adapterUri}`
        if (!idMapping[labwareId]) {
          idMapping[labwareId] = []
        }

        idMapping[labwareId].push(migratedLabwareId, migratedAdapterId)
      }
    })

    return mapValues(idMapping, value => value)
  }

  const labwaresMapped = mappedLabwareIds(Object.keys(labware))

  const loadPipetteCommands: LoadPipetteCreateCommand[] = commands
    .filter(
      (command): command is LoadPipetteCommandV6 =>
        command.commandType === 'loadPipette'
    )
    .map(command => ({
      ...command,
      params: {
        ...command.params,
        pipetteName: pipettes[command.params.pipetteId].name,
      },
    }))

  const loadModuleCommands: LoadModuleCreateCommand[] = commands
    .filter(
      (command): command is LoadModuleCommandV6 =>
        command.commandType === 'loadModule'
    )
    .map(command => ({
      ...command,
      params: {
        ...command.params,
        model: modules[command.params.moduleId].model,
      },
    }))

  const loadAdapterAndLabwareCommands: LoadLabwareCreateCommand[] = commands
    .filter(
      (command): command is LoadLabwareCommandV6 =>
        command.commandType === 'loadLabware' &&
        getIsAdapter(command.params.labwareId)
    )
    .flatMap(command => {
      const {
        adapterUri,
        labwareUri,
        adapterDisplayName,
        labwareDisplayName,
      } = getAdapterAndLabwareSplitInfo(command.params.labwareId)
      const labwareLocation = command.params.location
      let adapterLocation: LabwareLocation = 'offDeck'
      if (labwareLocation === 'offDeck') {
        adapterLocation = 'offDeck'
      } else if ('moduleId' in labwareLocation) {
        adapterLocation = { moduleId: labwareLocation.moduleId }
      } else if ('slotName' in labwareLocation) {
        adapterLocation = { slotName: labwareLocation.slotName }
      }
      const {
        parameters: adapterParameters,
        version: adapterVersion,
      } = allLatestDefs[adapterUri]
      const {
        parameters: labwareParameters,
        version: labwareVersion,
      } = allLatestDefs[labwareUri]
      const adapterId = labwaresMapped[command.params.labwareId][1]

      const loadAdapterCommand: LoadLabwareCreateCommand = {
        key: uuid(),
        commandType: 'loadLabware',
        params: {
          labwareId: adapterId,
          loadName: adapterParameters.loadName,
          namespace: 'opentrons',
          version: adapterVersion,
          location: adapterLocation,
          displayName: adapterDisplayName,
        },
      }

      const loadLabwareCommand: LoadLabwareCreateCommand = {
        key: uuid(),
        commandType: 'loadLabware',
        params: {
          labwareId: labwaresMapped[command.params.labwareId][0],
          loadName: labwareParameters.loadName,
          namespace: 'opentrons',
          version: labwareVersion,
          location: { labwareId: adapterId },
          displayName: labwareDisplayName,
        },
      }

      return [loadAdapterCommand, loadLabwareCommand]
    })
  const newLabwareDefinitions: LabwareDefinitionsByUri = Object.keys(
    labwareDefinitions
  ).reduce((acc: LabwareDefinitionsByUri, defId: string) => {
    const labwareDefinition = labwareDefinitions[defId]
    if (labwareDefinition == null) {
      console.error(
        `expected to find matching labware definition with definitionURI ${defId} but could not`
      )
    }
    const loadName = labwareDefinition.parameters.loadName
    if (ADAPTER_LABWARE_COMBO_LOAD_NAMES.includes(loadName)) {
      const { adapterUri, labwareUri } = getAdapterAndLabwareSplitInfo(defId)
      const adapterLabwareDef = allLatestDefs[adapterUri]
      const labwareDef = allLatestDefs[labwareUri]
      acc[adapterUri] = adapterLabwareDef
      acc[labwareUri] = labwareDef
    } else {
      acc[defId] = labwareDefinitions[defId]
    }
    return acc
  }, {})

  const loadLabwareCommands: LoadLabwareCreateCommand[] = commands
    .filter(
      (command): command is LoadLabwareCommandV6 =>
        command.commandType === 'loadLabware' &&
        getIsAdapter(command.params.labwareId) === false
    )
    .map(command => {
      const labwareId = command.params.labwareId
      const definitionId = labware[labwareId].definitionId
      const { namespace, version, parameters } = labwareDefinitions[
        definitionId
      ]
      const labwareLocation = command.params.location
      let location: LabwareLocation = 'offDeck'
      if (labwareLocation === 'offDeck') {
        location = 'offDeck'
      } else if ('moduleId' in labwareLocation) {
        location = { moduleId: labwareLocation.moduleId }
      } else if ('slotName' in labwareLocation) {
        location = { slotName: labwareLocation.slotName }
      }

      return {
        ...command,
        params: {
          ...command.params,
          loadName: parameters.loadName,
          namespace,
          version,
          location,
          displayName: labware[labwareId].displayName,
        },
      }
    })
  const newLabwareLocationUpdate: LabwareLocationUpdate = Object.keys(
    labwareLocationUpdate
  ).reduce((acc: LabwareLocationUpdate, labwareId: string) => {
    if (!getIsAdapter(labwareId)) {
      acc[labwareId] = labwareLocationUpdate[labwareId]
    } else {
      const adapterAndLabwareLocationUpdate: LabwareLocationUpdate = Object.entries(
        loadAdapterAndLabwareCommands
      ).reduce(
        (
          adapterAndLabwareAcc: LabwareLocationUpdate,
          [id, command]: [string, LoadLabwareCreateCommand]
        ) => {
          const { location, labwareId } = command.params
          const labId = labwareId ?? ''

          let locationString = ''
          if (location === 'offDeck') {
            locationString = 'offDeck'
          } else if ('moduleId' in location) {
            locationString = location.moduleId
          } else if ('slotName' in location) {
            locationString = location.slotName
          } else if ('labwareId' in location) {
            locationString = location.labwareId
          }
          adapterAndLabwareAcc[labId] = locationString
          return adapterAndLabwareAcc
        },
        {}
      )
      acc = { ...acc, ...adapterAndLabwareLocationUpdate }
    }
    return acc
  }, {})

  const getNewLabwareIngreds = (
    ingredLocations?: DesignerApplicationData['ingredLocations']
  ): DesignerApplicationData['ingredLocations'] => {
    const updatedIngredLocations: DesignerApplicationData['ingredLocations'] = {}
    if (ingredLocations == null) return {}
    for (const [labwareId, wellData] of Object.entries(ingredLocations)) {
      if (getIsAdapter(labwareId)) {
        const newLabwareId = labwaresMapped[labwareId][0]
        updatedIngredLocations[newLabwareId] = wellData
      } else {
        updatedIngredLocations[labwareId] = wellData
      }
    }
    return updatedIngredLocations
  }
  const newLabwareIngreds = getNewLabwareIngreds(ingredLocations)

  const migrateSavedStepForms = (
    savedStepForms: Record<string, any>
  ): Record<string, any> => {
    return mapValues(savedStepForms, stepForm => {
      if (stepForm.stepType === 'moveLiquid') {
        let aspirateLabwareDefinition =
          newLabwareDefinitions[labware[stepForm.aspirate_labware].definitionId]
        let aspirateLabware = stepForm.aspirate_labware
        if (getIsAdapter(stepForm.aspirate_labware)) {
          const { labwareUri } = getAdapterAndLabwareSplitInfo(
            stepForm.aspirate_labware
          )
          aspirateLabwareDefinition = newLabwareDefinitions[labwareUri]
          aspirateLabware = labwaresMapped[stepForm.aspirate_labware][0]
        }
        const aspirateTouchTipIncompatible = aspirateLabwareDefinition?.parameters.quirks?.includes(
          'touchTipDisabled'
        )
        let dispenseLabwareDefinition =
          newLabwareDefinitions[labware[stepForm.dispense_labware].definitionId]
        let dispenseLabware = stepForm.dispense_labware
        if (getIsAdapter(stepForm.dispense_labware)) {
          const { labwareUri } = getAdapterAndLabwareSplitInfo(
            stepForm.dispense_labware
          )
          dispenseLabwareDefinition = newLabwareDefinitions[labwareUri]
          dispenseLabware = labwaresMapped[stepForm.dispense_labware][0]
        }
        const dispenseTouchTipIncompatible = dispenseLabwareDefinition?.parameters.quirks?.includes(
          'touchTipDisabled'
        )
        return {
          ...stepForm,
          dispense_labware: dispenseLabware,
          aspirate_labware: aspirateLabware,
          aspirate_touchTip_checkbox: aspirateTouchTipIncompatible
            ? false
            : stepForm.aspirate_touchTip_checkbox ?? false,
          aspirate_touchTip_mmFromBottom: aspirateTouchTipIncompatible
            ? null
            : stepForm.aspirate_touchTip_mmFromBottom ?? null,
          dispense_touchTip_checkbox: dispenseTouchTipIncompatible
            ? false
            : stepForm.dispense_touchTip_checkbox ?? false,
          dispense_touchTip_mmFromBottom: dispenseTouchTipIncompatible
            ? null
            : stepForm.dispense_touchTip_mmFromBottom ?? null,
        }
      } else if (stepForm.stepType === 'mix') {
        let mixLabwareDefinition =
          newLabwareDefinitions[labware[stepForm.labware].definitionId]
        let mixLabware = stepForm.labware
        if (getIsAdapter(stepForm.labware)) {
          const { labwareUri } = getAdapterAndLabwareSplitInfo(stepForm.labware)
          mixLabwareDefinition = newLabwareDefinitions[labwareUri]
          mixLabware = labwaresMapped[stepForm.labware][0]
        }
        const mixTouchTipIncompatible = mixLabwareDefinition?.parameters.quirks?.includes(
          'touchTipDisabled'
        )
        return {
          ...stepForm,
          labware: mixLabware,
          mix_touchTip_checkbox: mixTouchTipIncompatible
            ? false
            : stepForm.mix_touchTip_checkbox ?? false,
          mix_touchTip_mmFromBottom: mixTouchTipIncompatible
            ? null
            : stepForm.mix_touchTip_mmFromBottom ?? null,
        }
      }

      return stepForm
    })
  }
  const filteredavedStepForms = Object.fromEntries(
    Object.entries(
      appData.designerApplication?.data?.savedStepForms ?? {}
    ).filter(([key, value]) => key !== INITIAL_DECK_SETUP_STEP_ID)
  )
  const newFilteredavedStepForms = migrateSavedStepForms(filteredavedStepForms)

  return {
    ...rest,
    designerApplication: {
      ...appData.designerApplication,
      version: PD_VERSION,
      data: {
        ...appData.designerApplication?.data,
        ingredLocations: {
          ...newLabwareIngreds,
        },
        savedStepForms: {
          [INITIAL_DECK_SETUP_STEP_ID]: {
            ...appData.designerApplication?.data?.savedStepForms[
              INITIAL_DECK_SETUP_STEP_ID
            ],
            labwareLocationUpdate: {
              ...newLabwareLocationUpdate,
            },
          },
          ...newFilteredavedStepForms,
        },
      },
    },
    schemaVersion: SCHEMA_VERSION,
    $otSharedSchema: '#/protocol/schemas/7',
    labwareDefinitions: {
      ...newLabwareDefinitions,
    },
    commands: [
      ...loadPipetteCommands,
      ...loadModuleCommands,
      ...loadAdapterAndLabwareCommands,
      ...loadLabwareCommands,
    ],
  }
}
