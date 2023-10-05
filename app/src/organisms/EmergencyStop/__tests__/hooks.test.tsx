import { renderHook } from '@testing-library/react-hooks'

import { useEstopContext } from '../hooks'

describe('useEstopContext', () => {
  it('should return the correct context values', () => {
    const { result } = renderHook(() => useEstopContext())
    expect(result.current.isEmergencyStopModalDismissed).toBe(false)
    expect(typeof result.current.setIsEmergencyStopModalDismissed).toBe(
      'function'
    )
  })
})
