import type { GameState } from './state';

export interface TemplateVars {
  readonly name: string;
  readonly ship: string;
  readonly target?: string;
}

export const TEMPLATE_TOKENS = ['name', 'ship', 'target'] as const;

/** Replaces `{name}`, `{ship}` and `{target}` in content text; unknown tokens are left as-is. */
export function fillTemplate(text: string, vars: TemplateVars): string {
  return text.replace(/\{(name|ship|target)\}/g, (match, key: keyof TemplateVars) => {
    const value = vars[key];
    return value === undefined ? match : value;
  });
}

export function templateVars(state: GameState, target?: string): TemplateVars {
  return { name: state.player.name, ship: state.ship.name, target };
}

/** Fills content text with the player's and ship's names from the current state. */
export function fillFromState(state: GameState, text: string, target?: string): string {
  return fillTemplate(text, templateVars(state, target));
}
