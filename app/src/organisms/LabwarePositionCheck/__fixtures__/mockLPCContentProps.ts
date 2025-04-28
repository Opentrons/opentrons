import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import { vi } from 'vitest'

export const mockLPCContentProps: LPCWizardContentProps = {
  runId: 'MOCK_RUN_ID',
  commandUtils: {} as any,
  proceedStep: vi.fn(),
  goBackLastStep: vi.fn(),
  bannerUtils: {
    defaultOffsetInfoBanner: { toggleBanner: vi.fn(), showBanner: false },
  },
}
