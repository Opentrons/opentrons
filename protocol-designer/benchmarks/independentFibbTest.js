// @flow
import bench from 'nanobench'
import { globallyMemoizedFibb } from '../fooUtil'

const max = 1000

bench(`run globallyMemoizedFibb 1-${max} FROM ANOTHER BENCHMARK FILE`, b => {
  // benchmark doesn't reset its imports, so anything that is globally cached will persist!
  b.start()
  for (let i = 1; i <= max; i++) {
    globallyMemoizedFibb(i)
  }
  b.end()
})
