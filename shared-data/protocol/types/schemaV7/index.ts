import { LoadedPipette, LoadedLabware, LoadedModule, Liquid } from '../../../js'
import type { CreateCommand, RunTimeCommand } from './command'
import type { LabwareDefinition2, RobotType } from '../../../js/types'

export * from './command'

// NOTE: must be kept in sync with '../schemas/7.json'
export interface ProtocolFile<DesignerApplicationData = {}> {
  $otSharedSchema: '#/protocol/schemas/7'
  schemaVersion: 7
  metadata: {
    protocolName?: string
    author?: string
    description?: string | null | undefined
    created?: number
    lastModified?: number | null | undefined
    category?: string | null | undefined
    subcategory?: string | null | undefined
    tags?: string[]
  }
  designerApplication?: {
    name?: string
    version?: string
    data?: DesignerApplicationData
  }
  robot: {
    model: 'OT-2 Standard' | 'OT-3 Standard'
    deckId: 'ot2_standard' | 'ot2_short_trash' | 'ot3_standard'
  }
  labwareDefinitions: {
    [definitionId: string]: LabwareDefinition2
  }
  liquids: {
    [liquidId: string]: {
      displayName: string
      description: string
      displayColor?: string
    }
  }
  commands: CreateCommand[]
  commandAnnotations?: {
    commandIds: string[]
    annotationType: string
    params?: { [key: string]: any }
  }
}

/**
 * This type should not be used, any time you want a function/hook/component to take in
 * a protocol file with run time commands, split your function signature to take in each param
 * separately, and import the RunTimeCommand type separately. RunTimeCommand is a server concept
 * and should not be mixed with our Protocol types
 * @deprecated Use {@link ProtocolFile}
 */
export interface ProtocolAnalysisFile<DesignerApplicationData = {}>
  extends Omit<ProtocolFile<DesignerApplicationData>, 'commands'> {
  commands: RunTimeCommand[]
}

/**
 * This type interface is represents the output of the opentrons analyze cli tool
 * which contains the protocol analysis engine
 * TODO: reconcile this type with that of the analysis returned from
 * the protocols record endpoints on the robot-server
 */
export interface ProtocolAnalysisOutput {
  createdAt: string
  files: AnalysisSourceFile[]
  config: JsonConfig | PythonConfig
  metadata: { [key: string]: any }
  commands: RunTimeCommand[]
  labware: LoadedLabware[]
  pipettes: LoadedPipette[]
  modules: LoadedModule[]
  liquids: Liquid[]
  errors: AnalysisError[]
  robotType?: RobotType
}

interface AnalysisSourceFile {
  name: string
  role: 'main' | 'labware'
}
export interface JsonConfig {
  protocolType: 'json'
  schemaVersion: number
}
export interface PythonConfig {
  protocolType: 'python'
  apiVersion: [major: number, minor: number]
}

interface AnalysisError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}
