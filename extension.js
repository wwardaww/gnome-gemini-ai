/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'geminiaiubuntu';

const { GObject, St, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;


const _ = ExtensionUtils.gettext;
const Me = ExtensionUtils.getCurrentExtension();


let USERNAME = GLib.get_real_name();

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Gemini ai for Ubuntu'));
        let icon = new St.Button({
            can_focus: false,  toggle_mode: false, child: new St.Icon({style_class: 'gemini-icon'})
        });
        this.initPot();
       
        icon.connect('clicked', () => {
            const systemSettings = St.Settings.get();
            let [mouse_x, mouse_y, _] = global.get_pointer();
            const theme = systemSettings.gtkThemeVariant?.toLowerCase().includes('dark') ? 'dark' : 'light';
            GLib.spawn_command_line_async(Me.path +`/gui/target/debug/geminigui ${theme} ${mouse_x} ${mouse_y} ${Me.path} userName=${USERNAME}`);
        });
        this.add_child(icon);
        this.menu.actor.style_class = "m-w-100"
       
    }
   
    initPot(){
        _("What's on your mind?");
        _("Geminiai API Key");
        _("How to get API key?");
        _("Select Gemini Model");
        _("Select Theme");
    }
});



class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);        
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
