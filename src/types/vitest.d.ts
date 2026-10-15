declare global {
  let describe: (typeof import('vitest'))['describe'];
  let it: (typeof import('vitest'))['it'];
  let expect: (typeof import('vitest'))['expect'];
  let test: (typeof import('vitest'))['test'];
  let suite: (typeof import('vitest'))['suite'];
  let beforeAll: (typeof import('vitest'))['beforeAll'];
  let afterAll: (typeof import('vitest'))['afterAll'];
  let beforeEach: (typeof import('vitest'))['beforeEach'];
  let afterEach: (typeof import('vitest'))['afterEach'];
  let vitest: (typeof import('vitest'))['vitest'];
  let vi: (typeof import('vitest'))['vitest'];
  let expectTypeOf: (typeof import('vitest'))['expectTypeOf'];
  let assertType: (typeof import('vitest'))['assertType'];
  let assert: (typeof import('vitest'))['assert'];
}
