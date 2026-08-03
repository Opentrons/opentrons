import { describe, it, vi } from 'vitest'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

vi.mock('@opentrons/react-api-client')

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

describe('ConnectForm UploadKey input field', () => {
  it.todo('replace deprecated enzyme test')
})
