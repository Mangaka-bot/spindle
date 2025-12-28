export type SpinnerColor = 
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
  | 'gray' | 'grey' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright'
  | 'magentaBright' | 'cyanBright' | 'whiteBright';

export type FinalState = 'completed' | 'failed' | 'warning' | 'info';
export type TaskState = 'pending' | 'processing' | 'skipped' | FinalState;
export type ExecutionType = 'initial' | 'auto' | 'retry';
export type ConsoleMethod = 'log' | 'info' | 'debug' | 'warn' | 'error';
export type StreamType = 'stdout' | 'stderr';

export interface StateConfig {
  readonly icon: string;
  readonly iconColor: SpinnerColor;
  readonly textColor: SpinnerColor;
}

export interface StateFormatters {
  readonly icon: string;
  readonly text: (t: string) => string;
}

export interface Renderable {
  renderToString(): string;
}

export interface LogEntry {
  readonly method: ConsoleMethod | 'raw';
  readonly args: readonly unknown[];
  readonly stream: StreamType;
}

export interface TaskNode {
  title: string;
  state: TaskState;
}

export interface RetryConfig {
  readonly tries: number;
  readonly delay?: number;
}

export interface RendererOptions {
  readonly renderer?: 'default' | 'simple' | 'silent';
}

export interface TaskOptions {
  readonly concurrent?: boolean;
  readonly exitOnError?: boolean;
}

export interface TaskConfig {
  readonly title: string;
  readonly setup?: (ctx: Record<string, unknown>, task: TaskNode) => Promise<unknown>;
  readonly task?: (ctx: Record<string, unknown>, task: TaskNode, type: ExecutionType) => Promise<unknown>;
  readonly afterEach?: (ctx: Record<string, unknown>, completedSubtask: TaskNode, mainTask: TaskNode) => Promise<void>;
  readonly finally?: (ctx: Record<string, unknown>, task: TaskNode) => Promise<void>;
  readonly options?: TaskOptions;
  readonly autoExecute?: number;
  readonly autoComplete?: number;
  readonly rollback?: (ctx: Record<string, unknown>, task: TaskNode) => Promise<void>;
  readonly skip?: (ctx: Record<string, unknown>) => boolean | string;
  readonly retry?: RetryConfig;
  readonly showTimer?: boolean;
  readonly batchDebounceMs?: number;
  readonly defaultSubtaskOptions?: Record<string, unknown>;
  readonly rendererOptions?: RendererOptions;
  readonly spinnerColor?: SpinnerColor;
}