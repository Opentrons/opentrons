export type WellRatio = 'n:n' | '1:many' | 'many:1'

export function getWellRatio(
  sourceWells?: string[] | null,
  destWells?: string[] | null,
  isDispensingIntoTrash?: boolean
): WellRatio | null | undefined {
  if (isDispensingIntoTrash) {
    if (!Array.isArray(sourceWells) || sourceWells.length === 0) {
      return null
    }
    if (sourceWells.length === 1) {
      return 'n:n'
    }
    if (sourceWells.length > 1) {
      return 'many:1'
    }
  } else {
    if (
      !Array.isArray(sourceWells) ||
      sourceWells.length === 0 ||
      !Array.isArray(destWells) ||
      destWells.length === 0
    ) {
      return null
    }

    if (sourceWells.length === destWells.length) {
      return 'n:n'
    }

    if (sourceWells.length === 1 && destWells.length > 1) {
      return '1:many'
    }

    if (sourceWells.length > 1 && destWells.length === 1) {
      return 'many:1'
    }
  }

  return null
}
