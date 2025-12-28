import type { SpinnerColor, StateConfig, FinalState } from './types.js';

export const SPINNER_FRAMES = [
  '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'
] as const;

export const SPINNER_INTERVAL = 80 as const;
export const DEFAULT_COLOR: SpinnerColor = 'cyan';

export const VALID_COLORS: ReadonlySet<string> = new Set<SpinnerColor>([
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'gray', 'grey', 'redBright', 'greenBright', 'yellowBright', 'blueBright',
  'magentaBright', 'cyanBright', 'whiteBright'
]);

export const STATE_CONFIG: Readonly<Record<FinalState | 'default', StateConfig>> = {
  completed: { icon: '✔', iconColor: 'green',  textColor: 'white'  },
  failed:    { icon: '✖', iconColor: 'red',    textColor: 'red'    },
  warning:   { icon: '⚠', iconColor: 'yellow', textColor: 'yellow' },
  info:      { icon: 'ℹ', iconColor: 'blue',   textColor: 'blue'   },
  default:   { icon: '○', iconColor: 'gray',   textColor: 'white'  }
};