import type {
  LabwareDefinition2,
  ModuleModel,
  PipetteName,
  ProtocolFile,
  RobotType,
} from '@opentrons/shared-data'
import type { Ingredients } from '@opentrons/step-generation'
import type { RootState as DismissRoot } from './dismiss'
import type { FileMetadataFields } from './file-data'
import type { RootState as IngredRoot } from './labware-ingred/reducers'
import type { RootState as StepformRoot } from './step-forms'

export interface PipetteLoadInfo {
  pipetteName: PipetteName
}
export interface ModuleLoadInfo {
  model: ModuleModel
}
export interface LabwareLoadInfo {
  displayName: string // either labwareDef displayName or user defined nickName
  labwareDefURI: string // the labware definition URI
}

export type Pipettes = Record<string, PipetteLoadInfo>
export type Modules = Record<string, ModuleLoadInfo>
export type Labware = Record<string, LabwareLoadInfo>
export interface PDMetadata {
  // pipetteId to tiprackModel
  pipetteTiprackAssignments: Record<string, string[]>
  dismissedWarnings: DismissRoot['dismissedWarnings']
  ingredients: Ingredients
  ingredLocations: IngredRoot['ingredLocations']
  savedStepForms: StepformRoot['savedStepForms']
  orderedStepIds: StepformRoot['orderedStepIds']
  pipettes: Pipettes
  modules: Modules
  labware: Labware
}

export interface DesignerApplication {
  designerApplication: {
    version: string
    name: string
    data: PDMetadata
  }
}

export interface PythonDesignerApplication extends DesignerApplication {
  robot: {
    model: RobotType
  }
  metadata: FileMetadataFields
  labwareDefinitions?: Record<string, LabwareDefinition2>
}

export interface PDPythonFile {
  pythonProtocol: string
  designerApplication: PythonDesignerApplication
}

export type PDProtocolFile = ProtocolFile<PDMetadata>

export function getPDMetadata(
  file: PDProtocolFile | PythonDesignerApplication
): PDMetadata {
  const metadata = file.designerApplication?.data

  if (!metadata) {
    throw new Error('expected designerApplication.data in file')
  }

  return metadata
}
