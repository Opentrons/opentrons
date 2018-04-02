// test utility functions

export function mockResolvedValue (mock, value) {
  mock.mockImplementation(() => new Promise((resolve) => {
    process.nextTick(() => resolve(value))
  }))
}

export function mockRejectedValue (mock, value) {
  mock.mockImplementation(() => new Promise((resolve, reject) => {
    process.nextTick(() => reject(value))
  }))
}
