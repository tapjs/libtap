require('./')(() => global.process = null, t => {
  t.pass('this is fine')
  t.fail('this not so much')
})
