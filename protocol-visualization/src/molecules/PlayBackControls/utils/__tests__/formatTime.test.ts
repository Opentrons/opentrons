import { describe, expect, it } from "vitest";
import { formatTime } from "../formatTime";

describe('formatTime', () => {
  it('formats seconds into M:SS when hours are zero and forceHoursFormat=false', () => {
      expect(formatTime(75, false)).toBe('1:15')
      expect(formatTime(9, false)).toBe('0:09')
    })

    it('formats seconds into H:MM:SS when hours are present', () => {
      expect(formatTime(3600, false)).toBe('1:00:00')
      expect(formatTime(3661, false)).toBe('1:01:01')
    })

    it('forces H:MM:SS format when forceHoursFormat=true even if hours=0', () => {
      expect(formatTime(75, true)).toBe('0:01:15')
      expect(formatTime(9, true)).toBe('0:00:09')
    })

    it('handles large hour values correctly', () => {
      expect(formatTime(7322, false)).toBe('2:02:02')
    })

    it('handles zero seconds', () => {
      expect(formatTime(0, false)).toBe('0:00')
      expect(formatTime(0, true)).toBe('0:00:00')
    })

})
