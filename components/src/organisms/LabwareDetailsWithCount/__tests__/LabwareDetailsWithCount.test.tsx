import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LabwareDetailsWithCount } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
  initReactI18next: vi.fn(),
}))

vi.mock('i18next', () => {
  return {
    default: {
      use: () => ({ init: vi.fn() }),
      createInstance: () => ({
        use: () => ({ init: vi.fn() }),
        init: vi.fn(),
        t: (k: string) => k,
      }),
      init: vi.fn(),
      t: (k: string) => k,
    },
  }
})
const render = (props: ComponentProps<typeof LabwareDetailsWithCount>) => {
  return renderWithProviders(<LabwareDetailsWithCount {...props} />)
}
describe('LabwareDetailsWithCount', () => {
  let props: ComponentProps<typeof LabwareDetailsWithCount>
  const t = vi.fn(key => key)
  beforeEach(() => {
    props = {
      title: 'Title',
      subTitle: 'SubTitle',
      quantity: 1,
    }
    vi.mocked(useTranslation).mockReturnValue({ t } as any)
  })

  it('should render title, subTitle and label', () => {
    render(props)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('SubTitle')).toBeInTheDocument()
    expect(screen.getByText('quantity')).toBeInTheDocument()
  })

  it('should render title without subTitle and label', () => {
    props.subTitle = undefined
    props.quantity = undefined
    render(props)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.queryByText('SubTitle')).not.toBeInTheDocument()
    expect(screen.queryByText('quantity')).not.toBeInTheDocument()
  })
})
