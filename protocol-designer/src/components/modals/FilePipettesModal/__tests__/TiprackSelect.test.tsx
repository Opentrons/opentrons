import type * as React from 'react'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { TiprackSelect } from '../TiprackSelect'
import { TiprackOption } from '../TiprackOption'

vi.mock('../TiprackOption')

const render = (props: React.ComponentProps<typeof TiprackSelect>) => {
  return renderWithProviders(<TiprackSelect {...props} />)[0]
}

describe('TiprackSelect', () => {
  let props: React.ComponentProps<typeof TiprackSelect>
  beforeEach(() => {
    vi.mocked(TiprackOption).mockReturnValue(<div>mock TiprackOption</div>)
    props = {
      mount: 'left',
      tiprackOptions: [
        { name: 'mockTip', value: 'mockUri' },
        { name: 'mockTip2', value: 'mockUri2' },
        { name: 'mockTip3', value: 'mockUri3' },
      ],
      onSetFieldValue: vi.fn(),
      values: {
        left: {
          pipetteName: 'mockPipetteName',
          tiprackDefURI: ['mockUri', 'mockUri2'],
        },
        right: { pipetteName: null, tiprackDefURI: null },
      },
    }
  })
  it('renders 3 options in tiprack option', () => {
    render(props)
    expect(screen.getAllByText('mock TiprackOption')).toHaveLength(3)
  })
})
