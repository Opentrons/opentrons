import type { CreateCommand } from '../../../command/types'
import type { CommandAnnotation } from '../../../commandAnnotation/types'
import type { LabwareDefinition2 } from '../../../js/types'

export * from '../../../command/types'

export interface CommandsStructure {
  commandSchemaId: string
  commands: any[]
}

export interface CommandV8Mixin {
  commandSchemaId: 'opentronsCommandSchemaV8'
  commands: CreateCommand[]
}

export interface CommandAnnotationsStructure {
  commandAnnotationSchemaId: string
  commandAnnotations: any[]
}

export interface CommandAnnotationV1Mixin {
  commandAnnotationSchemaId: 'opentronsCommandAnnotationSchemaV1'
  commandAnnotations: CommandAnnotation[]
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

export interface DeckStructure {
  model: string
  deckId: string
}

export interface OT2DeckSpec {
  model: 'OT-2 Standard'
  deckId: 'ot2_standard' | 'ot2_short_trash'
}

export interface OT3DeckSpec {
  model: 'OT-3 Standard'
  deckId: 'ot3_standard'
}

export interface RobotStructure {
  robot: {
    deckSchemaId: string
  } & DeckStructure
}

export interface RobotDeckV3Mixin {
  robot: {
    deckSchemaId: 'opentronsDeckSchemaV3'
  } & (OT2DeckSpec | OT3DeckSpec)
}

export interface RobotDeckV4Mixin {
  robot: {
    deckSchemaId: 'opentronsDeckSchemaV3'
  } & (OT2DeckSpec | OT3DeckSpec)
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
  }
  designerApplication?: {
    name?: string
    version?: string
    data?: DesignerApplicationData
  }
}

// NOTE: must be kept in sync with '../schemas/8.json'
export type ProtocolFile<
  DesignerApplicationData = {}
> = ProtocolBase<DesignerApplicationData> &
  (RobotDeckV3Mixin | RobotDeckV4Mixin) &
  LabwareV2Mixin &
  LiquidV1Mixin &
  CommandV8Mixin &
  CommandAnnotationV1Mixin

export type ProtocolStructure = ProtocolBase<{}> &
  RobotStructure &
  LabwareStructure &
  LiquidStructure &
  CommandsStructure &
  CommandAnnotationsStructure
