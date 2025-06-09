/** Utility functions for Python code generation. */

import type { WellLocation } from '@opentrons/shared-data/command/types/support'

/** The variable name for the ProtocolContext object in the run() function.
 * Our docs call it `protocol`, which is slightly misleading since the object is not
 * the protocol itself, but we'll try to stay consistent with the docs.
 */
export const PROTOCOL_CONTEXT_NAME = 'protocol'

/** The variable name for defining a labware that is off-deck or being moved to off-deck */
export const OFF_DECK = 'protocol_api.OFF_DECK'

/** The variable name for the Python dict containing the custom labware defintions. */
export const CUSTOM_LABWARE_DICT_NAME = 'CUSTOM_LABWARE'

const INDENT = '    '

/** Indent each of the lines in `text`. */
export function indentPyLines(text: string): string {
  return text
    .split('\n')
    .map(line => (line ? INDENT + line : line))
    .join('\n')
}

/** Render an arbitrary JavaScript value to Python. */
export function formatPyValue(value: any): string {
  switch (typeof value) {
    case 'undefined':
      return 'None'
    case 'boolean':
      return value ? 'True' : 'False'
    case 'number':
      // `float("Infinity")` and `float("NaN")` is how you write those values in Python
      return Number.isFinite(value) ? `${value}` : `float("${value}")`
    case 'string':
      return formatPyStr(value)
    case 'object':
      if (value === null) {
        return 'None'
      } else if (Array.isArray(value)) {
        // Detect nested tuple: e.g., [[10, 4], [12, 2]]
        if (
          value.length > 0 &&
          value.every(
            element =>
              Array.isArray(element) &&
              element.length === 2 &&
              element.every(number => typeof number === 'number')
          )
        ) {
          // Format as list of tuples: [(10, 4), (12, 2)]
          return `[${value.map(([a, b]) => `(${a}, ${b})`).join(', ')}]`
        }
        return formatPyList(value)
      } else {
        return formatPyDict(value as Record<string, any>)
      }
    default:
      throw Error('Cannot render value as Python', { cause: value })
  }
}

/** Render the string value to Python. */
export function formatPyStr(str: string): string {
  // Later, we can do something more elegant like outputting 'single-quoted' if str contains
  // double-quotes, but for now stringify() produces a valid and properly escaped Python string.
  return JSON.stringify(str)
}

/** Render an array value as a Python list. */
export function formatPyList(list: any[]): string {
  return `[${list.map(value => formatPyValue(value)).join(', ')}]`
}

/** Render an object as a Python dict. */
export function formatPyDict(
  dict: Record<string, any>,
  allSingleLine?: boolean
): string {
  const dictEntries = Object.entries(dict)
  // Render dict on single line if it has 1 entry, else render 1 entry per line.
  if (dictEntries.length <= 1 && !allSingleLine) {
    return `{${dictEntries
      .map(([key, value]) => `${formatPyStr(key)}: ${formatPyValue(value)}`)
      .join(', ')}}`
  } else {
    return `{\n${indentPyLines(
      dictEntries
        .map(([key, value]) => `${formatPyStr(key)}: ${formatPyValue(value)}`)
        .join(',\n')
    )},\n}`
  }
}

/** Render a WellLocation to Python.
 * Append the returned string to a Python well reference to get the wellLocation relative to the well.
 */
export function formatPyWellLocation(wellLocation?: WellLocation): string {
  const { x, y, z } = wellLocation?.offset || {}
  // Generating Python for well location is a bit annoying because the PAPI is not
  // homogenous. Here, emitZ is a flag that indicates if we still need to emit code
  // for the z-offset:
  let emitZ = !!z

  let origin = wellLocation?.origin
  // Seth says that if there's an offset but no origin, use `top` as the origin.
  if (!origin && (x || y || z)) {
    origin = 'top'
  }

  let python = ''
  if (origin) {
    python += ((): string => {
      // TypeScript checks that we've handled all the cases
      switch (origin) {
        case 'top':
          emitZ = false
          return `.top(${z ? `z=${z}` : ''})`
        case 'bottom':
          emitZ = false
          return `.bottom(${z ? `z=${z}` : ''})`
        case 'center':
          return '.center()' // center() doesn't allow z-offset
        case 'meniscus':
          emitZ = false
          return `.meniscus(${z ? `z=${z}` : ''})`
      }
    })()
  }
  if (x || y || emitZ) {
    const args = [
      ...(x ? [`x=${x}`] : []),
      ...(y ? [`y=${y}`] : []),
      ...(emitZ ? [`z=${z}`] : []),
    ]
    python += `.move(types.Point(${args.join(', ')}))`
  }
  return python
}
