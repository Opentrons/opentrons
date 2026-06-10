import type { CreateCommand } from '../../../command/types'
import type {
  CommandAnnotationV1,
  CommandAnnotationV2,
} from '../../../commandAnnotation/types'
import type {
  CommandPreconditions,
  LabwareOffsetRecord,
  Liquid,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  RunTimeParameter,
} from '../../../js'
import type { LabwareDefinition2, RobotType } from '../../../js/types'
import type { RunTimeCommand } from '../schemaV8'

export * from '../../../command/types'

export interface CommandsStructure {
  commandSchemaId: string
  commands: any[]
}

export interface CommandV8Mixin {
  commandSchemaId: 'opentronsCommandSchemaV8'
  commands: CreateCommand[]
}

export interface CommandV9Mixin {
  commandSchemaId: 'opentronsCommandSchemaV9'
  commands: CreateCommand[]
}

export interface CommandV10Mixin {
  commandSchemaId: 'opentronsCommandSchemaV10'
  commands: CreateCommand[]
}

export interface CommandV11Mixin {
  commandSchemaId: 'opentronsCommandSchemaV11'
  commands: CreateCommand[]
}

export interface CommandV12Mixin {
  commandSchemaId: 'opentronsCommandSchemaV12'
  commands: CreateCommand[]
}

export interface CommandV13Mixin {
  commandSchemaId: 'opentronsCommandSchemaV13'
  commands: CreateCommand[]
}

export interface CommandV14Mixin {
  commandSchemaId: 'opentronsCommandSchemaV14'
  commands: CreateCommand[]
}

export interface CommandV15Mixin {
  commandSchemaId: 'opentronsCommandSchemaV15'
  commands: CreateCommand[]
}

export interface CommandV16Mixin {
  commandSchemaId: 'opentronsCommandSchemaV16'
  commands: CreateCommand[]
}

export interface CommandV17Mixin {
  commandSchemaId: 'opentronsCommandSchemaV17'
  commands: CreateCommand[]
}

export interface CommandAnnotationsStructure {
  commandAnnotationSchemaId: string
  commandAnnotations: any[]
}

export interface CommandAnnotationV1Mixin {
  commandAnnotationSchemaId: 'opentronsCommandAnnotationSchemaV1'
  commandAnnotations: CommandAnnotationV1[]
}

export interface CommandAnnotationV2Mixin {
  commandAnnotationSchemaId: 'opentronsCommandAnnotationSchemaV2'
  commandAnnotations: CommandAnnotationV2[]
}

export interface LabwareStructure {
  labwareDefinitionSchemaId: string
  labwareDefinitions: {
    [definitionId: string]: any
  }
}

export interface LabwareV2Mixin {
  labwareDefinitionSchemaId: 'opentronsLabwareSchemaV2'
  labwareDefinitions: {
    [definitionId: string]: LabwareDefinition2
  }
}

export interface LiquidStructure {
  liquidSchemaId: string
  liquids: {
    [liquidId: string]: any
  }
}

export interface LiquidV1Mixin {
  liquidSchemaId: 'opentronsLiquidSchemaV1'
  liquids: {
    [liquidId: string]: {
      displayName: string
      description: string
      displayColor?: string
    }
  }
}

export interface RobotStructure {
  model: string
  deckId: string
}

export interface OT2RobotMixin {
  robot: {
    model: 'OT-2 Standard'
    deckId: 'ot2_standard' | 'ot2_short_trash'
  }
}

export interface OT3RobotMixin {
  robot: {
    model: 'OT-3 Standard'
    deckId: 'ot3_standard'
  }
}

export interface ProtocolBase<DesignerApplicationData> {
  $otSharedSchema: '#/protocol/schemas/8'
  schemaVersion: 8
  metadata: {
    protocolName?: string
    author?: string
    description?: string | null | undefined
    created?: number
    lastModified?: number | null | undefined
    category?: string | null | undefined
    subcategory?: string | null | undefined
    tags?: string[]
    source?: string | null
  }
  designerApplication?: {
    name?: string
    version?: string
    data?: DesignerApplicationData
  }
}

// NOTE: must be kept in sync with '../schemas/8.json'
export type ProtocolFile<DesignerApplicationData = {}> =
  ProtocolBase<DesignerApplicationData> &
    (OT2RobotMixin | OT3RobotMixin) &
    LabwareV2Mixin &
    LiquidV1Mixin &
    (
      | CommandV8Mixin
      | CommandV9Mixin
      | CommandV10Mixin
      | CommandV11Mixin
      | CommandV12Mixin
      | CommandV13Mixin
      | CommandV14Mixin
      | CommandV15Mixin
      | CommandV16Mixin
      | CommandV17Mixin
    ) &
    (CommandAnnotationV1Mixin | CommandAnnotationV2Mixin)

export type ProtocolStructure = ProtocolBase<{}> &
  RobotStructure &
  LabwareStructure &
  LiquidStructure &
  CommandsStructure &
  CommandAnnotationsStructure

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
  runTimeParameters: RunTimeParameter[]
  robotType?: RobotType
  commandAnnotations?: CommandAnnotationV1[] | CommandAnnotationV2[]
  commandPreconditions?: CommandPreconditions
  labwareOffsets?: LabwareOffsetRecord[]
  result: 'ok' | 'not-ok' | 'error' | 'parameter-value-required'
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
