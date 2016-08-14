import assert from 'power-assert';
import { camelToKebab, merge, pick, omit, mapValues, keys } from '../src/utils';

describe('utils', () => {

  describe('camelToKebab', () => {
    it('translates camelCase to kebab-case', () => {
      assert(camelToKebab('camelCaseToKebabCase') === 'camel-case-to-kebab-case');
    });

    it('does not add hyphen to the first position', () => {
      assert(camelToKebab('FirstPosition') === 'first-position');
    });

    it('does nothing if there is no camel case string', () => {
      assert(camelToKebab('no_camel-string0123') === 'no_camel-string0123');
    });

    it('adds hyphen between a number and a upper case character', () => {
      assert(camelToKebab('camel012Camel') === 'camel012-camel');
    });
  });

  describe('merge', () => {
    it('merges given objects and should not mutate any objects', () => {
      const a = { a: 1, b: 1 };
      const actual = merge(a, { a: 2, c: 1 }, { d: 1 }, { c: 2 });

      assert.deepEqual(actual, {
        a: 2,
        b: 1,
        c: 2,
        d: 1
      });
      assert.deepEqual(a, { a: 1, b: 1 }); // should not mutate
      assert(a !== actual); // should create new object
    });
  });

  describe('pick', () => {
    it('picks specified properties', () => {
      const a = { a: 1, b: 1, c: 1, d: 1 };
      const actual = pick(a, ['a', 'c', 'e']);

      assert.deepEqual(actual, { a: 1, c: 1 });
    });
  });

  describe('omit', () => {
    it('omits specified properties', () => {
      const a = { a: 1, b: 1, c: 1, d: 1 };
      const actual = omit(a, ['a', 'c', 'e']);

      assert.deepEqual(actual, { b: 1, d: 1 });
    });
  });

  describe('mapValues', () => {
    it('maps the values of an object', () => {
      const f = n => n + 1;
      const a = { a: 1, b: 2, c: 3 };
      const actual = mapValues(a, f);

      assert.deepEqual(actual, { a: 2, b: 3, c: 4 });
    });
  });

  describe('keys', () => {
    it('concats all objects\' keys', () => {
      const actual = keys({ a: 'a', b: 0 }, { b: '', c: null }, { d: false });

      // does not care about duplicated keys
      assert.deepEqual(actual, ['a', 'b', 'b', 'c', 'd']);
    });
  });
});
