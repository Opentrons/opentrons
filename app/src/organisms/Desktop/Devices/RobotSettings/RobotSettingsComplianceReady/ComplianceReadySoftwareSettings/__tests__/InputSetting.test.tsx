import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InputSetting } from '../InputSetting'

describe('InputSetting', () => {
  it('reverts to the saved value when onBlur fails', async () => {
    const onBlur = vi.fn().mockRejectedValue(new Error('patch failed'))
    render(
      <InputSetting label="Maximum login attempts" value="5" onBlur={onBlur} />
    )

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(input).toHaveValue(5)
    })
  })
})
