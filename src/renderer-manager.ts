import logUpdate from 'log-update';
import { SPINNER_FRAMES, SPINNER_INTERVAL } from './constants.js';
import type { Renderable, LogEntry, ConsoleMethod, StreamType } from './types.js';

type WriteFn = typeof process.stdout.write;
type OriginalConsole = Partial<Record<ConsoleMethod, typeof console.log>>;

const CONSOLE_METHODS: Readonly<Record<ConsoleMethod, StreamType>> = {
  log: 'stdout', info: 'stdout', debug: 'stdout', warn: 'stderr', error: 'stderr'
};

const CONSOLE_METHOD_KEYS = Object.keys(CONSOLE_METHODS) as readonly ConsoleMethod[];

const DEFAULT_FRAME = '⠋';

export class RendererManager {
  static #instance: RendererManager | null = null;

  readonly #activeRenderers = new Set<Renderable>();
  #originalConsole: OriginalConsole = {};
  #originalStdoutWrite: WriteFn | null = null;
  #originalStderrWrite: WriteFn | null = null;
  #logBuffer: LogEntry[] = [];
  #isInternalWrite = false;
  #intercepted = false;
  #renderScheduled = false;
  #spinnerIndex = 0;
  #spinnerInterval: ReturnType<typeof setInterval> | null = null;
  #isDisposed = false;

  private constructor() {}

  static getInstance(): RendererManager {
    let inst = RendererManager.#instance;
    if (!inst || inst.#isDisposed) {
      inst = new RendererManager();
      RendererManager.#instance = inst;
    }
    return inst;
  }

  static isActive(): boolean {
    const inst = RendererManager.#instance;
    return Boolean(inst && !inst.#isDisposed && inst.#activeRenderers.size);
  }

  static getActiveCount(): number {
    const inst = RendererManager.#instance;
    return inst && !inst.#isDisposed ? inst.#activeRenderers.size : 0;
  }

  static reset(force = false): void {
    const inst = RendererManager.#instance;
    if (!inst) return;

    if (!force && inst.#activeRenderers.size > 0) {
      console.warn(
        `RendererManager: ${inst.#activeRenderers.size} active renderers. Use reset(true) to force.`
      );
      return;
    }

    inst.dispose();
    RendererManager.#instance = null;
  }

  get isDisposed(): boolean {
    return this.#isDisposed;
  }

  getSpinnerFrame(): string {
    return SPINNER_FRAMES[this.#spinnerIndex] ?? DEFAULT_FRAME;
  }

  register(renderer: Renderable): void {
    if (this.#isDisposed) throw new Error('RendererManager disposed');

    const wasEmpty = this.#activeRenderers.size === 0;
    this.#activeRenderers.add(renderer);

    if (wasEmpty) this.#startManaging();
    this.scheduleRender();
  }

  unregister(renderer: Renderable): void {
    if (this.#isDisposed) return;

    this.#activeRenderers.delete(renderer);
    
    if (this.#activeRenderers.size === 0) {
      this.#stopManaging();
    } else {
      this.scheduleRender();
    }
  }

  scheduleRender(): void {
    if (this.#isDisposed || this.#renderScheduled || !this.#activeRenderers.size) return;

    this.#renderScheduled = true;
    setImmediate(() => {
      if (this.#isDisposed) return;
      this.#renderScheduled = false;
      this.#render();
    });
  }

  dispose(): void {
    if (this.#isDisposed) return;

    this.#isDisposed = true;
    this.#stopManaging();
    this.#activeRenderers.clear();
    this.#logBuffer.length = 0;
  }

  #startManaging(): void {
    if (this.#intercepted || this.#isDisposed) return;

    this.#interceptConsole();
    this.#interceptStreams();
    this.#intercepted = true;

    this.#spinnerInterval = setInterval(() => {
      if (this.#isDisposed) return this.#stopManaging();
      this.#spinnerIndex = (this.#spinnerIndex + 1) % SPINNER_FRAMES.length;
      this.#render();
    }, SPINNER_INTERVAL);

    this.#spinnerInterval.unref?.();
  }

  #stopManaging(): void {
    this.#flushLogBuffer();

    if (this.#spinnerInterval) {
      clearInterval(this.#spinnerInterval);
      this.#spinnerInterval = null;
    }

    if (this.#intercepted) {
      this.#restoreConsole();
      this.#restoreStreams();
      this.#intercepted = false;
      try {
        logUpdate.clear();
        logUpdate.done();
      } catch { /* noop */ }
    }

    this.#spinnerIndex = 0;
  }

  #render(): void {
    if (this.#isDisposed || !this.#activeRenderers.size) return;

    this.#flushLogBuffer();

    const outputs: string[] = [];
    for (const renderer of this.#activeRenderers) {
      try {
        const output = renderer.renderToString();
        if (output) outputs.push(output);
      } catch { /* noop */ }
    }

    if (outputs.length) {
      this.#internalWrite(() => logUpdate(outputs.join('\n\n')));
    }
  }

  #interceptConsole(): void {
    for (const method of CONSOLE_METHOD_KEYS) {
      const stream = CONSOLE_METHODS[method];
      this.#originalConsole[method] = console[method].bind(console);
      
      console[method] = (...args: unknown[]): void => {
        if (this.#isDisposed) {
          this.#originalConsole[method]?.(...args);
          return;
        }
        this.#logBuffer.push({ method, args, stream });
        this.scheduleRender();
      };
    }
  }

  #interceptStreams(): void {
    this.#originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.#originalStderrWrite = process.stderr.write.bind(process.stderr);

    const createInterceptor = (stream: StreamType, original: WriteFn): WriteFn => {
      return ((
        chunk: Uint8Array | string,
        encodingOrCb?: BufferEncoding | ((err?: Error) => void),
        callback?: (err?: Error) => void
      ): boolean => {
        if (this.#isInternalWrite || this.#isDisposed) {
          return (original as Function).call(
            stream === 'stdout' ? process.stdout : process.stderr,
            chunk, encodingOrCb, callback
          );
        }

        const encoding = typeof encodingOrCb === 'string' ? encodingOrCb : 'utf8';
        const cb = typeof encodingOrCb === 'function' ? encodingOrCb : callback;
        
        let str: string;
        if (typeof chunk === 'string') {
          str = chunk;
        } else {
          str = Buffer.from(chunk).toString(encoding);
        }

        if (str.trim()) {
          this.#logBuffer.push({ method: 'raw', args: [str], stream });
          this.scheduleRender();
        }

        cb?.();
        return true;
      }) as WriteFn;
    };

    process.stdout.write = createInterceptor('stdout', this.#originalStdoutWrite);
    process.stderr.write = createInterceptor('stderr', this.#originalStderrWrite);
  }

  #restoreConsole(): void {
    for (const method of CONSOLE_METHOD_KEYS) {
      const fn = this.#originalConsole[method];
      if (fn) console[method] = fn;
    }
    this.#originalConsole = {};
  }

  #restoreStreams(): void {
    if (this.#originalStdoutWrite) process.stdout.write = this.#originalStdoutWrite;
    if (this.#originalStderrWrite) process.stderr.write = this.#originalStderrWrite;
    this.#originalStdoutWrite = null;
    this.#originalStderrWrite = null;
  }

  #flushLogBuffer(): void {
    if (!this.#logBuffer.length) return;

    const buffer = this.#logBuffer.splice(0);
    this.#internalWrite(() => { try { logUpdate.clear(); } catch { /* noop */ } });

    for (const { method, args, stream } of buffer) {
      this.#internalWrite(() => {
        try {
          if (method === 'raw') {
            const writer = stream === 'stderr' 
              ? this.#originalStderrWrite 
              : this.#originalStdoutWrite;
            
            const text = args[0];
            if (writer && typeof text === 'string') {
              const output = text.endsWith('\n') ? text : `${text}\n`;
              (writer as Function).call(
                stream === 'stderr' ? process.stderr : process.stdout,
                output
              );
            }
          } else {
            this.#originalConsole[method as ConsoleMethod]?.(...args);
          }
        } catch { /* noop */ }
      });
    }
  }

  #internalWrite(fn: () => void): void {
    this.#isInternalWrite = true;
    try { fn(); } 
    finally { this.#isInternalWrite = false; }
  }
}

// Process cleanup handlers
if (typeof process !== 'undefined') {
  const cleanup = (): void => RendererManager.reset(true);
  process.once('exit', cleanup);
  process.once('SIGINT', () => { cleanup(); process.exit(130); });
  process.once('SIGTERM', () => { cleanup(); process.exit(143); });
}