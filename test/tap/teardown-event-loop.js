require('./')(
t => {
  t.pass('fine')
  const interval = setInterval(() => {}, 10000)
  t.teardown(() => clearInterval(interval))
}
)
