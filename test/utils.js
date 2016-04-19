import assert from 'power-assert';
import { camelToKebab } from '../src/utils';

describe('utils', () => {
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
