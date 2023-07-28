import { renderHook } from '@testing-library/react-hooks'

import { useEstopContext } from '../hooks'

describe('useEstopContext', () => {
  it('should return the correct context values', () => {
    const { result } = renderHook(() => useEstopContext())
    expect(result.current.isDismissedModal).toBe(false)
    expect(typeof result.current.setIsDismissedModal).toBe('function')
  })
})
