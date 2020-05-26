'use strict'
const t = require('../')
const Waiter = require('../lib/waiter.js')

function snapshotObject({ready, value, resolved, rejected, done, finishing, expectReject}) {
  return {ready, value, resolved, rejected, done, finishing, expectReject}
}

async function testHelper(t, promise, expectReject, action) {
  let waiterFromCB;
  let cbHits = 0;
  const cb = waiter => {
    cbHits++
    waiterFromCB = waiter
  }

  const w = new Waiter(promise, cb, expectReject)
  if (action === 'preabort') {
    w.abort('abort')
  } else {
    w.ready = true
  }

  t.matchSnapshot(snapshotObject(w), 'same tick')
  if (action === 'preabort') {
    t.equal(cbHits, 1, 'cb called same tick on preabort')
  } else {
    t.equal(cbHits, 0, 'cb not called same tick')
  }
  await w.promise
  t.matchSnapshot(snapshotObject(w), 'next tick')
  if (action === 'delayedabort') {
    w.abort('abort')
  } else if (action === 'extrafinish') {
    w.finish()
  }

  t.equal(cbHits, 1, 'cb called once after a tick')
  t.equal(waiterFromCB, w, 'cb called with waiter instance')
}

t.test('expected resolve', t => testHelper(t, Promise.resolve('resolve'), false))
t.test('unexpected resolve', t => testHelper(t, Promise.resolve('resolve'), true))
t.test('expected reject', t => testHelper(t, Promise.reject('reject'), true))
t.test('unexpected reject', t => testHelper(t, Promise.reject('reject'), false))

t.test('abort resolve', t => testHelper(t, Promise.resolve('resolve'), false, 'preabort'))
t.test('abort reject', t => testHelper(t, Promise.reject('reject'), true, 'preabort'))
t.test('abort after resolve', t => testHelper(t, Promise.resolve('resolve'), false, 'delayedabort'))
t.test('abort after reject', t => testHelper(t, Promise.reject('reject'), true, 'delayedabort'))

t.test('finish after resolve', t => testHelper(t, Promise.resolve('resolve'), false, 'extrafinish'))
t.test('finish after reject', t => testHelper(t, Promise.reject('reject'), true, 'extrafinish'))
