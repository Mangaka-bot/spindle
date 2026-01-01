<div align="center">

# Spindle

A lightweight, singleton-based CLI multi-spinner library for Node.js. Run multiple spinners simultaneously without visual corruption, with automatic console interception.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/npm/v/@shoru/spindle.svg?style=for-the-badge)](https://www.npmjs.com/package/@shoru/spindle)
[![Types](https://img.shields.io/badge/types-included-blue?style=for-the-badge&logo=typescript)](https://github.com/Mangaka-bot/spindle/tree/main/src)

[Installation](#-installation) · [Quick Start](#-quick-start) · [API](#-api)

</div>

---

## ✨ Features

- 🔄 **Multiple Concurrent Spinners** - Run as many spinners as you need
- 🎨 **Customizable Colors** - 17 color options for spinner customization
- 📝 **Console Interception** - `console.log` and friends work seamlessly without breaking spinners
- ✨ **Final States** - Complete spinners with success, failure, warning, or info icons
- 🧹 **Automatic Cleanup** - Graceful handling of process exit, SIGINT, and SIGTERM
- 📦 **Singleton Architecture** - Centralized render management for flicker-free output

## Installation

```bash
npm install @shoru/spindle
```

</div>

---

## 📦 Installation

```bash
npm install @shoru/spindle
```

> Requires Node.js 18+

---

## Quick Start

```javascript
import { spindle } from '@shoru/spindle';

const spinner = spindle('Loading...').start();

// Do some async work
await someAsyncTask();

spinner.succeed('Done!');
```

## API

### Creating a Spindle

```javascript
import { spindle, Spindle } from '@shoru/spindle';

// Using factory function (recommended)
const spinner = spindle('Initial text');

// Using constructor
const spinner = new Spindle('Initial text');
```

### Methods

#### `.start(text?)`

Starts the spinner. Optionally updates the text.

```javascript
spinner.start();
spinner.start('New loading message...');
```

#### `.stop()`

Stops the spinner without displaying a final message.

```javascript
spinner.stop();
```

#### `.succeed(text?)`

Stops with a green checkmark (✔).

```javascript
spinner.succeed('Task completed successfully');
```

#### `.fail(text?)`

Stops with a red cross (✖).

```javascript
spinner.fail('Task failed');
```

#### `.warn(text?)`

Stops with a yellow warning sign (⚠).

```javascript
spinner.warn('Task completed with warnings');
```

#### `.info(text?)`

Stops with a blue info icon (ℹ).

```javascript
spinner.info('Additional information');
```

### Properties

#### `.text` / `.title`

Get or set the spinner text. Both properties are interchangeable.

```javascript
spinner.text = 'Downloading files...';
console.log(spinner.text); // 'Downloading files...'
```

#### `.color`

Get or set the spinner color.

```javascript
spinner.color = 'magenta';
```

#### `.isSpinning`

Check if the spinner is currently active.

```javascript
if (spinner.isSpinning) {
  spinner.succeed('Finished');
}
```

### Available Colors

| Standard | Bright |
|----------|--------|
| `black` | `gray`/`grey` |
| `red` | `redBright` |
| `green` | `greenBright` |
| `yellow` | `yellowBright` |
| `blue` | `blueBright` |
| `magenta` | `magentaBright` |
| `cyan` | `cyanBright` |
| `white` | `whiteBright` |

> Default: `cyan`

### RendererManager

The `RendererManager` singleton coordinates all active spinners. You typically don't need to interact with it directly, but it's available for advanced use cases.

```javascript
import { RendererManager } from '@shoru/spindle';

// Check if any spinners are active
if (RendererManager.isActive()) {
  console.log('Spinners are running');
}

// Get count of active spinners
const count = RendererManager.getActiveCount();

// Force reset all spinners (use with caution)
RendererManager.reset(true);
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import { 
  Spindle, 
  spindle, 
  SpinnerColor, 
  FinalState, 
  TaskState,
  Renderable 
} from '@shoru/spindle';

const color: SpinnerColor = 'cyan';
const state: FinalState = 'completed';
```

## How It Works

1. **Singleton Renderer**: A single `RendererManager` coordinates all spinner instances
2. **Console Interception**: When spinners are active, console methods are intercepted and buffered
3. **Unified Rendering**: All spinners render to a single output using `log-update`
4. **Clean Output**: Buffered logs are flushed above the spinner display
5. **Graceful Cleanup**: Process signals trigger proper cleanup to restore console state

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create feature branch `git checkout -b feature/amazing-feature`
3. Commit changes `git commit -m 'Add amazing feature'`
4. Push `git push origin feature/amazing-feature`
5. Open Pull Request

---

<div align="center">

[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
<br>
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

<br>

**Made with ❤️ for the Node.js CLI community**

[⬆ Back to Top](#-spindle)
</div>