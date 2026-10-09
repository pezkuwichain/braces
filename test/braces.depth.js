'use strict';

require('mocha');
const assert = require('assert').strict;
const braces = require('..');

// CVE-2026-93687: deeply nested patterns under the length limit exhausted the
// stack in the recursive AST walkers and threw an uncaught RangeError.
const nested = depth => '{'.repeat(depth) + '}'.repeat(depth);
const parens = depth => '('.repeat(depth) + ')'.repeat(depth);

describe('nesting depth', () => {
  it('should reject brace nesting deeper than the limit with a SyntaxError', () => {
    for (const fn of ['parse', 'compile', 'expand']) {
      assert.throws(() => braces[fn](nested(4999)), err => err instanceof SyntaxError && /max depth/.test(err.message), fn);
    }
  });

  it('should reject parenthesis nesting deeper than the limit', () => {
    assert.throws(() => braces.parse(parens(4999)), err => err instanceof SyntaxError && /max depth/.test(err.message));
  });

  it('should accept nesting up to the limit', () => {
    assert.doesNotThrow(() => braces.expand(nested(500)));
    assert.throws(() => braces.expand(nested(501)), /max depth/);
  });

  it('should allow a lower limit through options.maxDepth', () => {
    assert.throws(() => braces.expand('a{b,{c,{d,e}}}', { maxDepth: 2 }), /max depth \(2\)/);
    assert.deepEqual(braces.expand('a{b,{c,{d,e}}}', { maxDepth: 3 }), ['ab', 'ac', 'ad', 'ae']);
  });

  it('should not let options.maxDepth raise the limit', () => {
    assert.throws(() => braces.expand(nested(501), { maxDepth: 10000 }), /max depth \(500\)/);
  });
});
