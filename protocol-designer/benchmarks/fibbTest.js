// @flow
import bench from 'nanobench'
import { globallyMemoizedFibb, makeMemoizedFibb } from '../fooUtil'

const max = 1000

bench(`run globallyMemoizedFibb 1-${max}`, b => {
  b.start()
  for (let i = 1; i <= max; i++) {
    globallyMemoizedFibb(i)
  }
  b.end()
})

bench(`run globallyMemoizedFibb 1-${max} again`, b => {
  // this reuses the same cache, there's no way to reset it
  b.start()
  for (let i = 1; i <= max; i++) {
    globallyMemoizedFibb(i)
  }
  b.end()
})

const f = makeMemoizedFibb()
bench(`run initial factory fibb 1-${max}`, b => {
  b.start()
  for (let i = 1; i <= max; i++) {
    f(i)
  }
  b.end()
})

bench(`run SAME factory fibb 1-${max} again`, b => {
  b.start()
  for (let i = 1; i <= max; i++) {
    f(i)
  }
  b.end()
})

const anotherF = makeMemoizedFibb()
bench(`run NEW DIFFERENT factory fibb 1-${max} again`, b => {
  b.start()
  for (let i = 1; i <= max; i++) {
    anotherF(i)
  }
  b.end()
})
