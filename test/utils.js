import assert from 'power-assert';
import { camelToKebab, assign, pick, mapValues } from '../src/utils';

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

  describe('assign', () => {
    it('extends the first argument by latter arguments', () => {
      const a = { a: 1, b: 1 };
      const actual = assign(a, { a: 2, c: 1 }, { d: 1 }, { c: 2 });

      assert.deepEqual(a, {
        a: 2,
        b: 1,
        c: 2,
        d: 1
      });
      assert(a === actual);
    });
  });

  describe('pick', () => {
    it('picks specified properties', () => {
      const a = { a: 1, b: 1, c: 1, d: 1 };
      const actual = pick(a, ['a', 'c', 'e']);

      assert.deepEqual(actual, { a: 1, c: 1 });
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
});
