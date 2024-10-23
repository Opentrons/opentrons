import type { LoadedPipette } from '@opentrons/shared-data'

export type LoadedPipettes = LoadedPipette[] | Record<string, LoadedPipette>
