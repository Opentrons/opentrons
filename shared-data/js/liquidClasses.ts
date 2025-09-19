import type { LiquidClass } from '.'

// NOTE: when we have more liquid names, we will need to add them in here.
// I can't figure out a way to do it autonomously while still having
// type protection. IMO its easier to just extend this type than not
// have type protection.
export type LiquidName = 'water' | 'ethanol_80' | 'glycerol_50' | 'none'

interface WithVersion<LiquidClass> {
  def: LiquidClass
  version: number
}

const liquidClassModules: Record<string, LiquidClass> = import.meta.glob(
  '../liquid-class/definitions/1/*/*/*.json',
  {
    eager: true,
  }
) as Record<string, LiquidClass>

// helper to parse info from the path
// example path: "../liquid-class/definitions/1/water/2.json"
const parsePath = (
  path: string
): { name: LiquidName; version: number; path: string } | null => {
  const match = path.match(/definitions\/\d+\/([^/]+)\/(\d+)\.json$/)
  if (!match) {
    return null
  }
  const [, name, versionStr] = match
  return { name: name as LiquidName, version: Number(versionStr), path }
}

// dictionary of latest versions only
const latestLiquidClasssDefinitions: Record<
  string,
  WithVersion<LiquidClass>
> = {}

const liquidClassNameConsts: Record<string, string> = { none: 'none' }

export const getAllLiquidClassDefs = (): Record<string, LiquidClass> => {
  Object.entries(liquidClassModules).forEach(([path, def]) => {
    const info = parsePath(path)
    if (!info) return
    const { name, version } = info

    const existing = latestLiquidClasssDefinitions[name]
    if (!existing || version > existing.version) {
      latestLiquidClasssDefinitions[name] = { def, version }
      liquidClassNameConsts[name] = `${name}V${version}`
    }
  })

  return Object.fromEntries(
    Object.entries(latestLiquidClasssDefinitions).map(([name, { def }]) => [
      name,
      def,
    ])
  )
}

// auto-generated name constant values
export const LIQUID_CLASS_NAMES_LATEST_VERSION = liquidClassNameConsts as Record<
  LiquidName,
  string
>
