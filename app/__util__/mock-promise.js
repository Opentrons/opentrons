// test utility functions

// TODO(mc, 2018-05-12): upgrade jest to get builtin mock resolve and reject
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

export function mockResolvedValueOnce (mock, value) {
  mock.mockImplementationOnce(() => new Promise((resolve) => {
    process.nextTick(() => resolve(value))
  }))
}

export function mockRejectedValueOnce (mock, value) {
  mock.mockImplementationOnce(() => new Promise((resolve, reject) => {
    process.nextTick(() => reject(value))
  }))
}
