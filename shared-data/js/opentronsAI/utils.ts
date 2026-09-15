interface CommandSchemaWithDiscriminator {
  $id?: string
  discriminator: {
    mapping: Record<string, string>
  }
}

const commandSchemaModules: Record<string, CommandSchemaWithDiscriminator> =
  import.meta.glob('../../command/schemas/*.json', {
    eager: true,
    import: 'default',
  })

type CommandSchemaModule =
  (typeof commandSchemaModules)[keyof typeof commandSchemaModules]

type CommandTypesFromSchema<S extends CommandSchemaWithDiscriminator> =
  keyof S['discriminator']['mapping']

/**
 * All commandTypes declared across command schema JSON files (via import.meta.glob).
 * new schema files under shared-data/command/schemas/ are picked up automatically.
 */
export type LatestCommandSchemaCommandType =
  CommandTypesFromSchema<CommandSchemaModule>

/**
 * Command types from the latest shared-data command schema that do not appear in
 * user-authored protocols (setup, calibration, unsafe, robot maintenance, etc.).
 *
 * When the latest command schema gains a new commandType, opentronsAICommandTypes.test
 * fails until it is added here or an OpentronsAIBaseArgs interface is added in types.ts.
 */
export const NON_PROTOCOL_COMMAND_TYPES = [
  'calibration/calibrateGripper',
  'calibration/calibrateModule',
  'calibration/calibratePipette',
  'calibration/moveToMaintenancePosition',
  'custom',
  'createCSV',
  'csvWriteRow',
  'getNextTip',
  'getTipPresence',
  'identifyModule',
  'liquidProbe',
  'pressureDispense',
  'reloadLabware',
  'retractAxis',
  'robot/closeGripperJaw',
  'robot/moveAxesRelative',
  'robot/moveAxesTo',
  'robot/moveTo',
  'robot/openGripperJaw',
  'savePosition',
  'sealPipetteToTip',
  'setRailLights',
  'setStatusBar',
  'setTipState',
  'unsafe/blowOutInPlace',
  'unsafe/dropTipInPlace',
  'unsafe/engageAxes',
  'unsafe/flexStacker/closeLatch',
  'unsafe/flexStacker/manualRetrieve',
  'unsafe/flexStacker/openLatch',
  'unsafe/flexStacker/prepareShuttle',
  'unsafe/placeLabware',
  'unsafe/ungripLabware',
  'unsafe/updatePositionEstimators',
  'unsealPipetteFromTip',
  // NOTE: the load commands are generated separately from commandCreators
  'loadLabware',
  'loadLid',
  'loadLidStack',
  'loadLiquid',
  'loadLiquidClass',
  'loadModule',
  'loadPipette',
] as const satisfies readonly LatestCommandSchemaCommandType[]

export type NonProtocolCommandType = (typeof NON_PROTOCOL_COMMAND_TYPES)[number]

export type OpentronsAICommandType = Exclude<
  LatestCommandSchemaCommandType,
  NonProtocolCommandType
>

function getLatestCommandSchema(): {
  schema: CommandSchemaWithDiscriminator
  version: number
} {
  let highestVersion = -Infinity
  let latestSchema: CommandSchemaWithDiscriminator | null = null

  for (const path in commandSchemaModules) {
    const match = path.match(/(\d+)\.json$/)
    if (match == null) {
      continue
    }
    const version = Number(match[1])
    if (version > highestVersion) {
      highestVersion = version
      latestSchema = commandSchemaModules[path]
    }
  }

  if (latestSchema == null) {
    throw new Error('No command schema files found in /command/schemas')
  }

  return { schema: latestSchema, version: highestVersion }
}

export function getLatestCommandSchemaVersion(): number {
  return getLatestCommandSchema().version
}

export function getLatestCommandSchemaCommandTypes(): string[] {
  const { schema } = getLatestCommandSchema()

  if (schema.discriminator?.mapping == null) {
    throw new Error(
      `discriminator.mapping not found in command schema v${getLatestCommandSchemaVersion()}`
    )
  }

  return Object.keys(schema.discriminator.mapping).sort()
}

const nonProtocolCommandTypeSet = new Set<string>(NON_PROTOCOL_COMMAND_TYPES)

/** command types in the latest schema that may appear in user protocols.
 * this is needed for a test
 */
export function getProtocolCommandTypesFromLatestSchema(): string[] {
  return getLatestCommandSchemaCommandTypes().filter(
    commandType => !nonProtocolCommandTypeSet.has(commandType)
  )
}
