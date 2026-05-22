# Audio Switch2 – Cinnamon Applet

Switch between audio output devices (sinks) with a single click.

## Features

- **Left-click** – cycle through your selected audio sinks
- **Right-click** – open a menu to select which sinks to cycle (up to 2)
- **Icon changes** automatically:
  - 🎧 Headphone icon for USB/headset devices
  - 🖥️ Monitor icon for HDMI/DisplayPort outputs
  - 🔊 Generic icon for other sinks
- **Persistent selection** – remembers your chosen sinks after reboot
- **Configurable logging** – reduce log clutter

## Installation

1. Copy the applet folder to:
`~/.local/share/cinnamon/applets/audio-switch2@thefuchsbau.eu/`

2. Restart Cinnamon (`Alt+F2` → `r` → Enter)
3. Right‑click on the panel → **Add applets to panel** → find **Audio Switch2** → click **+Add**

## Usage

1. **Right‑click** the applet icon → a menu appears with all available audio sinks.
2. **Toggle switches** to select up to 2 sinks (the ones you want to cycle between).
3. **Left‑click** the icon → the active audio output switches to the next selected sink.
4. The icon changes to reflect the current output (headphone/monitor/generic).

## Configuration

Create a file `config.json` in the applet folder:
```
{
 "logLevel": 1,
 "usePactlAsPrimary": false
}
```

### logLevel values

| Value | Output |
| - | - |
| 0	| Only errors |
| 1	| Errors + warnings |
| 2	| Errors + warnings + info |
| 3	| All (debug) |

Default is 2 if the file is missing. Logs appear in Looking Glass (Alt+F2 → lg → Log tab) or ~/.xsession-errors.