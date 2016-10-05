function createRoutes() {
  const Foo = { template: '<div><em>foo</em></div>' }
  const Bar = { template: '<div>bar</div>' }
  const routes = [
    // { path: '/', component: Home },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar }
  ]

  return routes
}

module.exports = {
  createRoutes: createRoutes
}
