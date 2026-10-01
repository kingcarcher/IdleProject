import { describe, expect, it } from 'vitest';
import { fillFromState, fillTemplate } from './text';
import { startedState } from './testUtils';

describe('fillTemplate', () => {
  it('replaces known tokens and leaves unknown ones alone', () => {
    const vars = { name: 'Juno', ship: 'Threnody', target: 'Mara' };
    expect(fillTemplate('{name} signs for the {ship}.', vars)).toBe('Juno signs for the Threnody.');
    expect(fillTemplate('You write to {target}.', vars)).toBe('You write to Mara.');
    expect(fillTemplate('No {target} here.', { name: 'J', ship: 'S' })).toBe('No {target} here.');
    expect(fillTemplate('Keep {mystery} and {{name}}.', vars)).toBe('Keep {mystery} and {Juno}.');
  });

  it('reads the player and ship names from state', () => {
    const state = startedState('Juno');
    expect(fillFromState(state, '{name} aboard the {ship}')).toBe('Juno aboard the Threnody');
    expect(fillFromState(state, 'to {target}', 'Ruth')).toBe('to Ruth');
  });
});
