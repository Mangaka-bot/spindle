import chalk from 'chalk';
import { VALID_COLORS, DEFAULT_COLOR, STATE_CONFIG } from './constants.js';
import type { SpinnerColor, FinalState, StateFormatters } from './types.js';

type ChalkFn = (text: string) => string;

const getColorFn = (color: SpinnerColor): ChalkFn => 
  chalk[color] as ChalkFn;

export const getChalkColor = (color: SpinnerColor): ChalkFn =>
  getColorFn(VALID_COLORS.has(color) ? color : DEFAULT_COLOR);

export const getStateFormatters = (state: FinalState): StateFormatters => {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.default;
  const iconFn = getColorFn(config.iconColor);
  const textFn = getColorFn(config.textColor);
  
  return {
    icon: iconFn(config.icon),
    text: textFn
  };
};