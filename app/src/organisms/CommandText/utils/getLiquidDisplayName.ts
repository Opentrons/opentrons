import type { CommandTextData } from '../types'

export function getLiquidDisplayName(
  commandTextData: CommandTextData,
  liquidId: string
): CommandTextData['liquids'][number]['displayName'] {
  const liquidDisplayName = (commandTextData?.liquids ?? []).find(
    liquid => liquid.id === liquidId
  )?.displayName
  return liquidDisplayName ?? ''
}
