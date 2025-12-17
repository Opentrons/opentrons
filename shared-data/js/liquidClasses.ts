import type { LiquidClass } from '.'

// NOTE: when we have more liquid names, we will need to add them in here.
// I can't figure out a way to do it autonomously while still having
// type protection. IMO its easier to just extend this type than not
// have type protection.
export type LiquidClassType = 'water' | 'ethanol_80' | 'glycerol_50' | 'none'

interface WithVersion<LiquidClass> {
  def: LiquidClass
  version: number
}

const liquidClassModules: Record<string, LiquidClass> = import.meta.glob(
  '../liquid-class/definitions/1/*/*.json',
  {
    eager: true,
  }
) as Record<string, LiquidClass>

// helper to parse info from the path
// example path: "../liquid-class/definitions/1/water/2.json"
const parsePath = (
  path: string
): { name: LiquidClassType; version: number; path: string } | null => {
  const match = path.match(/definitions\/\d+\/([^/]+)\/(\d+)\.json$/)
  if (!match) {
    return null
  }
  const [, name, versionStr] = match
  return { name: name as LiquidClassType, version: Number(versionStr), path }
}

// TODO: make none liquid class definition file
export const getAllLiquidClassDefs = (): Record<string, LiquidClass> => {
  // dictionary of latest versions only
  const latestLiquidClasssDefinitions: Record<
    string,
    WithVersion<LiquidClass>
  > = {}

  Object.entries(liquidClassModules).forEach(([path, def]) => {
    const info = parsePath(path)
    if (!info) return
    const { name, version } = info
    const existing = latestLiquidClasssDefinitions[name]
    if (!existing || version > existing.version) {
      latestLiquidClasssDefinitions[name] = { def, version }
    }
  })
  return Object.fromEntries(
    Object.entries(latestLiquidClasssDefinitions).map(([name, { def }]) => [
      name,
      def,
    ])
  )
}

// Add more liquid class name consts here
export const WATER_LIQUID_CLASS_NAME = 'water'
export const ETHANOL_LIQUID_CLASS_NAME = 'ethanol_80'
export const GLYCEROL_LIQUID_CLASS_NAME = 'glycerol_50'
export const NONE_LIQUID_CLASS_NAME = 'none'
