import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { useEstopQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { EstopMissingModal } from '../EstopMissingModal'
import { EstopPressedModal } from '../EstopPressedModal'
import {
  ENGAGED,
  LOGICALLY_ENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
} from '../constants'
import { EstopTakeover } from '../EstopTakeover'

jest.mock('@opentrons/react-api-client')
jest.mock('../EstopMissingModal')
jest.mock('../EstopPressedModal')

const mockPressed = {
  data: {
    status: PHYSICALLY_ENGAGED,
    leftEstopPhysicalStatus: ENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}

const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>
const mockEstopMissingModal = EstopMissingModal as jest.MockedFunction<
  typeof EstopMissingModal
>
const mockEstopPressedModal = EstopPressedModal as jest.MockedFunction<
  typeof EstopPressedModal
>

const render = (props: React.ComponentProps<typeof EstopTakeover>) => {
  return renderWithProviders(<EstopTakeover {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopTakeover', () => {
  let props: React.ComponentProps<typeof EstopTakeover>

  beforeEach(() => {
    props = {
      robotName: 'Flex',
    }
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    mockEstopMissingModal.mockReturnValue(<div>mock EstopMissingModal</div>)
    mockEstopPressedModal.mockReturnValue(<div>mock EstopPressedModal</div>)
  })

  it('should render EstopPressedModal - PHYSICALLY_ENGAGED', () => {
    const [{ getByText }] = render(props)
    getByText('mock EstopPressedModal')
  })

  it('should render EstopPressedModal - LOGICALLY_ENGAGED', () => {
    mockPressed.data.status = LOGICALLY_ENGAGED
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    const [{ getByText }] = render(props)
    getByText('mock EstopPressedModal')
  })

  it('should render EstopMissingModal - NOT_PRESENT', () => {
    mockPressed.data.status = NOT_PRESENT
    mockPressed.data.leftEstopPhysicalStatus = NOT_PRESENT
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    const [{ getByText }] = render(props)
    getByText('mock EstopMissingModal')
  })
})
