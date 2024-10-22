import type { LoadedModule } from '@opentrons/shared-data'

export type LoadedModules = LoadedModule[] | Record<string, LoadedModule>
