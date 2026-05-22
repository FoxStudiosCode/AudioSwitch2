// Audio Switch Applet (Refactored) - STANDARD ICONS TEST
// Uses only freedesktop standard icon names

const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const AppletPopupMenu = imports.ui.applet.AppletPopupMenu;
const Cvc = imports.gi.Cvc;

const AppName = "AudioSwitch2";
const AppNameLogPrefix = "[" + AppName + "]";

const Logger = {
    debug: (m) => global.log(AppNameLogPrefix + "[DEBUG] " + m),
    info: (m) => global.log(AppNameLogPrefix + "[INFO] " + m),
    warn: (m) => global.log(AppNameLogPrefix + "[WARN] " + m),
    error: (m) => global.log(AppNameLogPrefix + "[ERROR] " + m),
};

// ---------------- ICONS (all standard symbolic) ----------------
const ICONS = {
    headphone: "audio-headphones-symbolic",   // standard headphones icon
    monitor: "video-display-symbolic",        // standard monitor/screen icon
    fallback: "audio-card-symbolic"           // generic audio icon
};

// ---------------- APPLET ----------------
function AudioSwitch(metadata, orientation, panelHeight, instanceId) {
    this._init(metadata, orientation, panelHeight, instanceId);
}

AudioSwitch.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init(metadata, orientation, panelHeight, instanceId) {
        try {
            Applet.IconApplet.prototype._init.call(this, orientation, panelHeight, instanceId);

            // Log that initialization started
            Logger.info("Initializing applet");

            this.settings = this._buildSettings(instanceId);
            this._signals = [];
            this._sinks = [];
            this._selectedSinks = [];

            this.menu = null;
            this.mixer = new Cvc.MixerControl({ name: "AudioSwitch" });

            this.set_applet_tooltip("Audio Switch");

            // Set a temporary icon immediately so the applet is visible
            this.set_applet_icon_symbolic_name(ICONS.fallback);
            Logger.debug("Set fallback icon");

            this._initMixer();
            this._initMenu(orientation);

            Logger.info("Initialization complete");
        } catch(e) {
            global.logError("[AudioSwitch] FATAL: " + e.toString());
            global.logError(e.stack);
        }
    },

    // ---------------- SETTINGS ----------------
    _buildSettings(instanceId) {
        try {
            return new imports.ui.settings.AppletSettings(
                this,
                "audio-switch2@thefuchsbau.eu",
                instanceId
            );
        } catch (e) {
            Logger.warn("Settings unavailable fallback mode");
            return null;
        }
    },

    _loadSettings() {
        if (!this.settings) return;
        this._selectedSinks = this.settings.getValue("selected-sinks") || [];
        Logger.debug("Loaded settings: " + JSON.stringify(this._selectedSinks));
    },

    _saveSettings() {
        if (!this.settings) return;
        this.settings.setValue("selected-sinks", this._selectedSinks);
        Logger.debug("Saved settings: " + JSON.stringify(this._selectedSinks));
    },

    // ---------------- MIXER ----------------
    _initMixer() {
        Logger.debug("Opening mixer");
        this.mixer.open();

        this._signals.push(
            this.mixer.connect("state-changed", (_, state) => {
                Logger.debug("Mixer state changed: " + state);
                if (state === 2 || state === Cvc.MixerControlState.READY) {
                    Logger.info("Mixer ready");
                    this._onReady();
                }
            })
        );

        this._signals.push(
            this.mixer.connect("default-sink-changed", () => {
                Logger.debug("Default sink changed");
                this._updateUI();
            })
        );

        if (this.mixer.get_state() === 2 || this.mixer.get_state() === Cvc.MixerControlState.READY) {
            Logger.debug("Mixer already ready");
            this._onReady();
        }
    },

    _onReady() {
        Logger.debug("_onReady called");
        this._loadSettings();
        this._refreshSinks();
        this._updateUI();
        this._rebuildMenu();
    },

    // ---------------- SINKS ----------------
    _refreshSinks() {
        this._sinks = this.mixer.get_sinks() || [];
        Logger.debug("Refreshed sinks, count: " + this._sinks.length);
    },

    _getCurrentSink() {
        return this.mixer.get_default_sink();
    },

    _setSinkByName(name) {
        for (let s of this._sinks) {
            if (s.get_name() === name) {
                this.mixer.set_default_sink(s);
                Logger.info("Switched to sink: " + name);
                return true;
            }
        }
        Logger.warn("Sink not found: " + name);
        return false;
    },


// ---------------- MENU ----------------
_initMenu(orientation) {
    Logger.debug("_initMenu: creating menu");
    this.menuManager = new PopupMenu.PopupMenuManager(this);
    this.menu = new AppletPopupMenu(this, orientation);
    this.menuManager.addMenu(this.menu);
    // Override the default context menu (About/Configure/Remove)
    this._applet_context_menu = this.menu;
    this._rebuildMenu();
},

// Left click – cycle sinks
on_applet_clicked(event) {
    Logger.debug("Left click – cycling sinks");
    this._cycleSink();
    return true;
},

// Right click – show custom menu
on_applet_right_clicked(event) {
    Logger.debug("Right click – showing custom menu");
    this.menu.toggle();
    return true;
},

_cycleSink() {
    Logger.debug("_cycleSink called");
    let current = this._getCurrentSink();
    if (!current) {
        Logger.warn("No current sink");
        return;
    }
    let selected = this._selectedSinks;
    Logger.debug(`Selected sinks: ${JSON.stringify(selected)}`);
    if (selected.length === 0) {
        Logger.debug("No selected sinks, please select at least one from the right‑click menu");
        // Optionally show a notification here
        return;
    }
    let currentName = current.get_name();
    let idx = selected.indexOf(currentName);
    let next;
    if (idx === -1) {
        next = selected[0];
        Logger.debug(`Current sink not in list, switching to first: ${next}`);
    } else {
        next = selected[(idx + 1) % selected.length];
        Logger.debug(`Cycling from ${currentName} to ${next}`);
    }
    this._setSinkByName(next);
},

    _rebuildMenu() {
        if (!this.menu) return;
        Logger.debug("Rebuilding menu");

        this.menu.removeAll();
        this._refreshSinks();

        let title = new PopupMenu.PopupMenuItem("Select up to 2 outputs");
        title.actor.reactive = false;
        this.menu.addMenuItem(title);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        for (let sink of this._sinks) {
            let name = sink.get_name();
            let isSelected = this._selectedSinks.indexOf(name) !== -1;

            let item = new PopupMenu.PopupSwitchMenuItem(
                this._formatSinkName(sink),
                isSelected
            );

            item.connect("toggled", (_, state) => {
                this._toggleSelection(name, state);
            });

            this.menu.addMenuItem(item);
        }
    },

    _toggleSelection(name, state) {
        Logger.debug("Toggle " + name + " to " + state);
        let idx = this._selectedSinks.indexOf(name);

        if (state && idx === -1) {
            if (this._selectedSinks.length >= 2) {
                let removed = this._selectedSinks.shift();
                Logger.debug("Removed " + removed + " to keep max 2");
            }
            this._selectedSinks.push(name);
        }

        if (!state && idx !== -1) {
            this._selectedSinks.splice(idx, 1);
        }

        this._saveSettings();
        this._rebuildMenu();
    },

    // ---------------- UI ----------------
    _updateUI() {
        let sink = this._getCurrentSink();
        if (!sink) {
            Logger.warn("No sink for UI update, using fallback icon");
            this.set_applet_icon_symbolic_name(ICONS.fallback);
            return;
        }

        let name = sink.get_name();
        Logger.debug("Updating UI for sink: " + name);

        if (name.includes("hdmi") || name.includes("monitor")) {
            this.set_applet_icon_symbolic_name(ICONS.monitor);
            Logger.debug("Set monitor icon");
        } else if (name.includes("usb") || name.includes("head")) {
            this.set_applet_icon_symbolic_name(ICONS.headphone);
            Logger.debug("Set headphone icon");
        } else {
            this.set_applet_icon_symbolic_name(ICONS.fallback);
            Logger.debug("Set fallback icon");
        }
    },

    _formatSinkName(sink) {
        let desc = sink.get_description ? sink.get_description() : sink.get_name();
        return desc || sink.get_name();
    },

    // ---------------- CLEANUP ----------------
    on_applet_removed_from_panel() {
        for (let id of this._signals) {
            this.mixer.disconnect(id);
        }
        this._signals = [];
        if (this.menu) {
            this.menu.destroy();
        }
        Logger.info("Applet removed from panel");
    }
};

function main(metadata, orientation, panelHeight, instanceId) {
    return new AudioSwitch(metadata, orientation, panelHeight, instanceId);
}
