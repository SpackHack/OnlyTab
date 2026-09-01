# OnlyTab

A Firefox extension that allows only one tab per domain to stay open. Automatically closes duplicate tabs.

## Features

- Keep only one tab open per domain
- Track how many tabs were closed
- Simple and clean UI with animations
- Easy domain management

## Installation

1. Clone or download this repository
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from this project

## Usage

1. Click the extension icon in the toolbar
2. Add domains you want to restrict (e.g., `youtube.com`)
3. Only one tab per domain will stay open
4. View stats for how many tabs were closed

## Development

```bash
npm install
npm run build
```

Built files are in the `dist/` folder.
