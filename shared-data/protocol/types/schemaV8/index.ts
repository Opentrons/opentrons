import type { CreateCommand } from '../../../command/types'
import type { CommandAnnotation } from '../../../commandAnnotation/types'
import type { LabwareDefinition2 } from '../../../js/types'

export * from '../../../command/types'

// NOTE: must be kept in sync with '../schemas/8.json'
export interface ProtocolFile<DesignerApplicationData = {}> {
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
  commandSchemaRef: string
  commands: CreateCommand[]
  commandAnnotationSchemaRef: string
  commandAnnotations: CommandAnnotation[]
}
