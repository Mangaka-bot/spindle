import chalk from 'chalk';
import { RendererManager } from './renderer-manager.js';
import { getChalkColor, getStateFormatters } from './helpers.js';
import type { SpinnerColor, FinalState, Renderable } from './types.js';

export type { SpinnerColor, FinalState, TaskState, TaskConfig, Renderable } from './types.js';
export { RendererManager } from './renderer-manager.js';

export class Spindle implements Renderable {
  #text: string;
  #color: SpinnerColor = 'cyan';
  #isActive = false;
  #finalState: FinalState | null = null;
  #manager: RendererManager | null = null;

  constructor(text = '') {
    this.#text = text;
  }

  start(text?: string): this {
    if (text !== undefined) this.#text = text;
    if (this.#isActive) return this;

    this.#isActive = true;
    this.#finalState = null;
    this.#manager = RendererManager.getInstance();
    this.#manager.register(this);
    return this;
  }

  stop(): this {
    if (!this.#isActive) return this;

    this.#isActive = false;
    this.#manager?.unregister(this);
    this.#manager = null;
    return this;
  }

  succeed(text?: string): this { return this.#complete('completed', text); }
  fail(text?: string): this { return this.#complete('failed', text); }
  warn(text?: string): this { return this.#complete('warning', text); }
  info(text?: string): this { return this.#complete('info', text); }

  #complete(state: FinalState, text?: string): this {
    this.#finalState = state;
    const finalText = text ?? this.#text;
    const { icon, text: colorText } = getStateFormatters(state);
    const line = `${icon} ${colorText(finalText)}`;

    if (!this.#isActive) {
      console.log(line);
      return this;
    }

    this.#isActive = false;
    this.#manager?.scheduleRender();

    setImmediate(() => {
      console.log(line);
      this.#manager?.unregister(this);
      this.#manager = null;
      this.#finalState = null;
    });

    return this;
  }

  get text(): string { return this.#text; }
  set text(value: string) {
    this.#text = value;
    this.#manager?.scheduleRender();
  }

  get title(): string { return this.#text; }
  set title(value: string) { this.text = value; }

  get color(): SpinnerColor { return this.#color; }
  set color(value: SpinnerColor) {
    this.#color = value;
    this.#manager?.scheduleRender();
  }

  get isSpinning(): boolean { return this.#isActive; }

  renderToString(): string {
    if (this.#finalState) return '';

    const frame = RendererManager.getInstance().getSpinnerFrame();
    return `${getChalkColor(this.#color)(frame)} ${chalk.white(this.#text)}`;
  }
}

export function spindle(text = ''): Spindle {
  return new Spindle(text);
}

export default Spindle;