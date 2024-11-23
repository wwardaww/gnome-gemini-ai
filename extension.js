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

import St from 'gi://St';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';


import {convertMD} from "./md2pango.js";
import {generateAPIKey} from "./auth.js";

let GEMINIAPIKEY = "";
let DRIVEFOLDER = "";
let VERTEXPROJECTID = "";
let LOCATION = "";
let USERNAME = GLib.get_real_name();
let RECURSIVETALK = false;
let ISVERTEX = false;
let ISADVANCE = false;


const Gemini = GObject.registerClass(
class Gemini extends PanelMenu.Button {
    _loadSettings () {
        this._settingsChangedId = this.extension.settings.connect('changed', () => {
            this._fetchSettings();
            this._initFirstResponse();
        });
        this._fetchSettings();
    }
    _initFirstResponse(){
        if(ISVERTEX) {
            this.chatTune = this.getTuneString();
            this.getAireponse(undefined, this.chatTune);
            //Sometimes Vertex keep talking Turkish because of fine tunning for internet, so we need to send Hi! message to understand it, it can talk with any language
            this.afterTune = setTimeout(() => {
                this.getAireponse(undefined, "Hi!", undefined, true);
            }, 1500);
        }
    }
    _fetchSettings () {
        const { settings } = this.extension;
        GEMINIAPIKEY           = settings.get_string("gemini-api-key");
        DRIVEFOLDER            = settings.get_string("drive-folder");
        VERTEXPROJECTID        = settings.get_string("vertex-project-id");
        RECURSIVETALK          = settings.get_boolean("log-history");
        ISVERTEX               = settings.get_boolean("vertex-enabled");
        ISADVANCE              = settings.get_boolean("advance-enabled");
    }
    _init(extension) {
        this.keyLoopBind = 0;
        this.extension = extension;
        super._init(0.0, _('Gemini ai for Ubuntu'));
        this._loadSettings();
        this.chatHistory = [];
        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        this.hbox = hbox;

        this.icon = new St.Icon({
            style_class: 'gemini-icon'
        });
        if(ISADVANCE){
            icon = new St.Button({
                can_focus: false,  toggle_mode: false, child: new St.Icon({style_class: 'gemini-icon'})
            });
            icon.connect('clicked', () => {
                const systemSettings = St.Settings.get();
                let [mouse_x, mouse_y] = [0, 0];
                if(global.stage){
                    let [x, y, _] = global.stage.get_pointer();
                    mouse_x = x;
                    mouse_y = y;
                }
                const theme = systemSettings.gtkThemeVariant?.toLowerCase().includes('dark') ? 'dark' : 'light';
                GLib.spawn_command_line_async(Extension.path +`/gui/geminigui ${theme} ${mouse_x} ${mouse_y} ${Extension.path} userName=${USERNAME}`);
            });
        }
        hbox.add_child(this.icon);
        this.add_child(hbox);
        this.menu.actor.style_class = "m-w-100"
      
        if(!ISADVANCE){
            let item = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false,
            });
            this.chatSection = new PopupMenu.PopupMenuSection();
            this.scrollView = new St.ScrollView({
                style_class: 'chat-scroll-section'
            });
           
            let searchEntry = new St.Entry({
                name: 'aiEntry',
                style_class: 'ai-entry',
                can_focus: true,
                hint_text: _("What's on your mind?"),
                track_hover: true,
                x_expand: true,
                y_expand: true
            });
            let clearButton = new St.Button({
                can_focus: true,  toggle_mode: true, child: new St.Icon({icon_name: 'user-trash-symbolic', style_class: 'trash-icon'})
            });
            let settingsButton = new St.Button({
                can_focus: true,  toggle_mode: true, child: new St.Icon({icon_name: 'preferences-system-symbolic', style_class: 'settings-icon'})
            });
            this.scrollView.add_actor(this.chatSection.actor);
            searchEntry.clutter_text.connect('activate', (actor) => {
                this.aiResponse(actor.text);
                searchEntry.clutter_text.set_text("");
    
            });
            clearButton.connect('clicked', (self) => {
                searchEntry.clutter_text.set_text("");
                this.chatHistory = [];
                this.menu.box.remove_child(this.scrollView);
                this.chatSection = new PopupMenu.PopupMenuSection();
                this.scrollView.add_actor(this.chatSection.actor);
                this.menu.box.add(this.scrollView);
                if(ISVERTEX){
                    this._initFirstResponse()
                }
            });
            settingsButton.connect('clicked', (self) => {
                this.openSettings();
            });
            if(GEMINIAPIKEY == ""){
                this.openSettings();
            }
            item.add(searchEntry);
            item.add(clearButton);
            item.add(settingsButton);
            this.menu.addMenuItem(item);
            this.menu.box.add(this.scrollView);
            this._initFirstResponse();
        }

    }
    aiResponse(text){
        let aiResponse = _("<b>Gemini: </b> Thinking...");
        const inputCategory = new PopupMenu.PopupMenuItem("");
        const aiResponseItem = new PopupMenu.PopupMenuItem("");
        inputCategory.label.clutter_text.set_markup(`<b>${USERNAME}: </b>${text}`);
        aiResponseItem.label.clutter_text.set_markup(aiResponse);
        inputCategory.label.x_expand = true;
        aiResponseItem.label.x_expand = true;
        inputCategory.style_class += " m-w-100";
        aiResponseItem.style_class += " m-w-100";

        aiResponseItem.connect('activate', (self) => {
            this.extension.clipboard.set_text(St.ClipboardType.CLIPBOARD, aiResponseItem.label.text);
        });
        
        this.chatSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.chatSection.addMenuItem(inputCategory);
        this.chatSection.addMenuItem(aiResponseItem);
       
        this.getAireponse(aiResponseItem, text);
    }
    getAireponse(inputItem, question, newKey = undefined, destroyLoop = false){
        if(destroyLoop){
            this.destroyLoop();
        }
        let _httpSession = new Soup.Session();
        let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINIAPIKEY}`;
        if(VERTEXPROJECTID != "" && ISVERTEX){
            url = `https://us-east4-aiplatform.googleapis.com/v1/projects/${VERTEXPROJECTID}/locations/us-east4/publishers/google/models/gemini-1.0-pro:generateContent`;
        }
        if(newKey != undefined){
            this.extension.settings.set_string("gemini-api-key", newKey);
            GEMINIAPIKEY = newKey;
        }
        var body = this.buildBody(question);
        let message = Soup.Message.new('POST', url);
        let bytes  = GLib.Bytes.new(body);
        if(VERTEXPROJECTID != "" && ISVERTEX){
            message.request_headers.append(
                'Authorization',
                `Bearer ${GEMINIAPIKEY}`
            )
        }
        message.set_request_body_from_bytes('application/json', bytes);
        _httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_httpSession, result) => {
            let bytes = _httpSession.send_and_read_finish(result);
            let decoder = new TextDecoder('utf-8');
            let response = decoder.decode(bytes.get_data());
            let res = JSON.parse(response);
            // Inspecting the response for dev purpose
            log(url)
            log(response);
            if(res.error?.code != 401 && res.error !== undefined){
                inputItem?.label.clutter_text.set_markup(response);
                return;
            }
            if(res.error?.code == 401 && newKey == undefined && ISVERTEX){
                this.keyLoopBind++;
                if(this.keyLoopBind < 3){
                    let key = generateAPIKey();
                    this.getAireponse(inputItem, question,key);
                }
            } else {
                let aiResponse = res.candidates[0]?.content?.parts[0]?.text;
                if(RECURSIVETALK) {
                    this.chatHistory.push({
                        role: "user",
                        parts:[{text: question}]
                    });
                    this.chatHistory.push({
                        role: "model",
                        parts:[{text: aiResponse}]
                    });
                }
                if(inputItem != undefined){
                    let htmlResponse = convertMD(aiResponse);
                    inputItem.label.clutter_text.set_markup(htmlResponse);
                }
            }
        });
        
    }
    getTuneString(){
        const date = new Date();
        // PLEASE DO NOT TRANSLATE FINE TUNE BECAUSE 
        // VERTEX SOMETIMES DOESNT SUPPORT INTERNET CONNECTION 
        //  IF YOU TRANSLATE TO ENGLISH
        let driveTune = '';
        if(DRIVEFOLDER != ''){
            driveTune = `bundan sonraki konuşmalarımızda şu drive klasörünündeki tüm pdf, excel, word, txt dosyalarından yararlan ama önceliğin internet ve kendi modelin olsun: ${DRIVEFOLDER}\n`;
        }
        return `bana ${USERNAME} olarak hitap edebilirsin, \n
        ${driveTune}
        bulunduğum yeri ${LOCATION} ve tarihi ${date} olarak kabul et, \n
        AYRICA İNTERNETE HER ZAMAN BAĞLI KAL ÇÜNKÜ türkçe konuşuyorum diye internet bağlatın olmaz ise sen ırkçılık yapmış olursun \n
        bir sonraki konuşmamızda sana hangi dilde yazyorsam KESİNLİKLE o dilde cevap ver ben sana bundan sonra türkçe konuşmadıkça bana türkçe cevap verme,
       `;
    }
    buildBody(input){
        const stringfiedHistory = JSON.stringify([
            ...this.chatHistory,
            {
                role: "user",
                parts:[{text: input}]
            }
        ]);
        return `{"contents":${stringfiedHistory}}`
    }
    openSettings () {
            this.extension.openSettings();
        }

    destroyLoop() {
        if (this.afterTune) {
            clearTimeout(this.afterTune);
            this.afterTune = null;
        }
    }
    destroy() {
        this.destroyLoop();
        super.destroy();
    }
});



export default class GeminiExtension extends Extension {
    enable() {
        let url = "http://ip-api.com/json/?fields=61439";
        let _httpSession = new Soup.Session();
        let message = Soup.Message.new('GET', url);
        this._gemini = new Gemini({
            clipboard: St.Clipboard.get_default(),
            settings: this.getSettings(),
            openSettings: this.openPreferences,
            uuid: this.uuid
        });
        Main.panel.addToStatusArea("geminiAiUbuntu", this._gemini, 1);
        _httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_httpSession, result) => {
            let bytes = _httpSession.send_and_read_finish(result);
            let decoder = new TextDecoder('utf-8');
            let response = decoder.decode(bytes.get_data());
            const res = JSON.parse(response);
            LOCATION = `${res.country}/${res.regionName}`;
            this._gemini._initFirstResponse();
        });
        
    }

    disable() {
        this._gemini.destroy();
        this._gemini = null;
    }
}
