import HeroTypeDataModel from "../datamodels/actor/hero.mjs"
import NPCTypeDataModel from "../datamodels/actor/npc.mjs"
import SkillTypeDataModel from "../datamodels/item/skill.mjs"
import EquipmentTypeDataModel from "../datamodels/item/equipment.mjs"
import SpellTypeDataModel from "../datamodels/item/spell.mjs"
import PotionTypeDataModel from "../datamodels/item/potion.mjs"
import HeroVueSheet from "../sheets/vue/actor/hero-sheet.mjs"
import NPCVueSheet from "../sheets/vue/actor/npc-sheet.mjs"
import SkillVueSheet from "../sheets/vue/item/skill-sheet.mjs"
import EquipmentVueSheet from "../sheets/vue/item/equipment-sheet.mjs"
import SpellVueSheet from "../sheets/vue/item/spell-sheet.mjs"
import PotionVueSheet from "../sheets/vue/item/potion-sheet.mjs"
import DataTableApp from "../sheets/vue/datatable-app.mjs";
import SkillRollPromptApp from "../sheets/vue/item/prompts/skill-Roll-prompt-app.mjs";
import KitchenSinkEffectSheet from "../sheets/active-effect-sheet.mjs";
import KitchenSinkActor from "../documents/actor.mjs";
import KitchenSinkItem from "../documents/item.mjs";
import KitchenSinkCombatant from "../documents/combatant.mjs";
import KitchenSinkTokenDocument from "../documents/token.mjs";
import KitchenSinkToken from "../canvas/token.mjs";
import KitchenSinkRoll from "../rolls/roll.mjs";
import DocumentCreationVueDialog from "../sheets/vue/document-creation-dialog.mjs";
import MeasuredTemplatePreview from "../placeables/measured-template-preview.mjs";

export function init() {
    console.log('kitchen-sink | Initializing System');

    CONFIG.ActiveEffect.legacyTransferral = false;

    registerSettings();
    registerDataModels();
    registerDocumentSheets();
    registerDocumentClasses();
    registerPromptClasses();
    registerCanvasClasses();
    registerTypeInfo();
    registerHandlebarsHelpers();
    registerResourceBars();
    registerStatusEffects();
    registerUtils();
    //addVueImportMap();

    game.system.documentHooks = new Map();
    game.system.datatableApp = DataTableApp;
    game.system.rollClass = KitchenSinkRoll;
    CONFIG.Dice.rolls.push(KitchenSinkRoll);
}

/* -------------------------------------------- */

function registerSettings() {

    game.settings.register('kitchen-sink', 'roundUpDamageApplication', {
        name: game.i18n.localize("SETTINGS.RoundUpDamageApplicationName"),
        hint: game.i18n.localize("SETTINGS.RoundUpDamageApplicationHint"),
        scope: 'world',
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register('kitchen-sink', 'allowTargetDamageApplication', {
        name: game.i18n.localize('SETTINGS.AllowTargetDamageApplicationName'),
        hint: game.i18n.localize('SETTINGS.AllowTargetDamageApplicationHint'),
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
        requiresReload: true
    });

    game.settings.register('kitchen-sink', 'userTargetDamageApplicationType', {
        scope: 'client',
        config: false,
        default: 'selected',
        type: String
    });

    game.settings.register('kitchen-sink', 'hotReloadLastState', {
        scope: 'client',
        config: false,
        default: { openWindows: [] },
        type: Object
    });

    game.settings.register('kitchen-sink', 'documentColorThemes', {
        scope: 'client',
        config: false,
        default: {},
        type: Object
    });

    game.settings.register('kitchen-sink', 'documentLastState', {
        scope: 'client',
        config: false,
        default: {},
        type: Object
    });
    
    game.settings.register('kitchen-sink', 'documentTableColumns', {
        scope: 'client',
        config: false,
        default: {},
        type: Object
    });
}

/* -------------------------------------------- */

function registerDataModels() {
    CONFIG.Actor.dataModels = {
        hero: HeroTypeDataModel,
        npc: NPCTypeDataModel
    };

    CONFIG.Item.dataModels = {
        skill: SkillTypeDataModel,
        equipment: EquipmentTypeDataModel,
        spell: SpellTypeDataModel,
        potion: PotionTypeDataModel
    };
}

/* -------------------------------------------- */

function registerDocumentSheets() {
    Actors.unregisterSheet("core", ActorSheet);
    Items.unregisterSheet("core", ItemSheet);

    // Actors
    Actors.registerSheet("kitchen-sink", HeroVueSheet, {types: ["hero"], makeDefault: true});
    Actors.registerSheet("kitchen-sink", NPCVueSheet, {types: ["npc"], makeDefault: true});

    // Items
    Items.registerSheet("kitchen-sink", SkillVueSheet, {types: ["skill"], makeDefault: true});
    Items.registerSheet("kitchen-sink", EquipmentVueSheet, {types: ["equipment"], makeDefault: true});
    Items.registerSheet("kitchen-sink", SpellVueSheet, {types: ["spell"], makeDefault: true});
    Items.registerSheet("kitchen-sink", PotionVueSheet, {types: ["potion"], makeDefault: true});

    // Active Effects
    DocumentSheetConfig.registerSheet(ActiveEffect, "kitchen-sink", KitchenSinkEffectSheet, { makeDefault: true });
}

/* -------------------------------------------- */

function registerDocumentClasses() {
    CONFIG.Actor.documentClass = KitchenSinkActor;
    CONFIG.Item.documentClass = KitchenSinkItem;
    CONFIG.Combatant.documentClass = KitchenSinkCombatant;
    CONFIG.Token.documentClass = KitchenSinkTokenDocument;
    
    game.system.measuredTemplatePreviewClass = MeasuredTemplatePreview;
}

/* -------------------------------------------- */

function registerPromptClasses() {
    game.system.prompts = {
        skillRoll: SkillRollPromptApp
        ,

    };
    game.system.documentCreateDialog = DocumentCreationVueDialog;
}

/* -------------------------------------------- */

function registerCanvasClasses() {
    CONFIG.Token.objectClass = KitchenSinkToken;
}

/* -------------------------------------------- */

function registerTypeInfo() {
    CONFIG.Actor.defaultType = "hero";
    CONFIG.Item.defaultType = "skill";

    CONFIG.Actor.typeArtworks = {
        "npc": "/icons/creatures/mammals/beast-horned-scaled-glowing-orange.webp"
    };
    
    CONFIG.Item.typeArtworks = {
    };

    CONFIG.Actor.typeDescriptions = {
    }
    CONFIG.Item.typeDescriptions = {
    }

    CONFIG.Actor.typeCreatables = {
    }
    CONFIG.Item.typeCreatables = {
    }
}

/* -------------------------------------------- */

function registerHandlebarsHelpers() {

    // Convert a type and value to a localized label
    Handlebars.registerHelper("typeLabel", (type, value) => {
        return game.i18n.localize(CONFIG.SYSTEM[type][value]?.label);
    });

    // Truncate a string to a certain length with an ellipsis
    Handlebars.registerHelper("truncate", (str, len) => {
        if (str.length > len) {
            return `${str.slice(0, len)}...`;
        }
        return str;
    });

    // Get a property on an object using a string key
    Handlebars.registerHelper("getProperty", (obj, key) => {
        if (obj == null) return "";
        return foundry.utils.getProperty(obj, key);
    });

    // Humanize a string
    Handlebars.registerHelper("humanize", (str) => {
        let humanized = str.replace(/_/g, " ");
        humanized = humanized.replace("system.", "").replaceAll(".", " ");
        humanized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
        return humanized;
    });
}

/* -------------------------------------------- */

function registerResourceBars() {
    CONFIG.Actor.trackableAttributes = {
        "hero": {
            "bar": ["resourcefield","hp","stagger","mana"],
            "value": []
        },
        "npc": {
            "bar": [],
            "value": []
        }
    };
}

/* -------------------------------------------- */

function registerStatusEffects() {
    CONFIG.statusEffects = [
        
        {"id":"unconscious","name":"EFFECT.StatusUnconscious","img":"icons/svg/unconscious.svg"},
        {"id":"invisible","name":"EFFECT.StatusInvisible","img":"icons/svg/invisible.svg"},
        {
            id: "dead",
            name: "Dead",
            label: "Dead",
            icon: "icons/svg/skull.svg",
            img: "icons/svg/skull.svg",
            calculated: true
        },
        {
            id: "staggered",
            name: "Staggered",
            label: "Staggered",
            icon: "icons/svg/upgrade.svg",
            img: "icons/svg/upgrade.svg",
            calculated: false
        }
    ];
}


/** -------------------------------------------- */

function addVueImportMap() {
    let script = document.createElement('script');
    script.type = 'importmap';
    script.text = `{
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }`;
    document.head.appendChild(script);
}

/* -------------------------------------------- */

function registerUtils() {
    game.system.utils = {};

    function flattenObject(obj, _d=0) {
        const flat = {};
        if ( _d > 100 ) {
            throw new Error("Maximum depth exceeded");
        }
        for ( let [k, v] of Object.entries(obj) ) {
            let t = foundry.utils.getType(v);
            if ( t === "Object" ) {
                if ( k == "parent" ) continue;
                if ( foundry.utils.isEmpty(v) ) flat[k] = v;
                let inner = flattenObject(v, _d+1);
                for ( let [ik, iv] of Object.entries(inner) ) {
                    flat[`${k}.${ik}`] = iv;
                }
            }
            else flat[k] = v;
        }
        return flat;
    }

    game.system.utils.flattenObject = flattenObject;

    function toNearest(interval=1, method="round") {
        if (!Number.isNumeric(this)) {
            throw new Error("toNearest() must be called on a numeric looking value");
        }
        const number = Number.fromString(this);
        return number.toNearest(interval, method);
    }

    Object.defineProperties(String.prototype, {
        toNearest: {value: toNearest}
    });

    async function callAllAsync(hook, ...args) {
        if ( CONFIG.debug.hooks ) {
            console.log(`DEBUG | Calling async ${hook} hook with args:`);
            console.log(args);
        }
        const events = Hooks.events;
        if ( !(hook in events) ) return true;
        for ( const entry of Array.from(events[hook]) ) {
            await entry.fn(...args);
        }
        return true;
    }

    Hooks.callAllAsync = callAllAsync;
    
    let audioSources = new Map();
    let gainNodes = new Map();
    
    async function playAudio(id, url, onEndCallback, volume=0.5) {
        let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let source = audioCtx.createBufferSource();
        let gainNode = audioCtx.createGain();
        audioSources.set(id, source);
        gainNodes.set(id, gainNode);
        source.connect(gainNode).connect(audioCtx.destination);

        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
            let audioData = request.response;
            audioCtx.decodeAudioData(audioData,
                (buffer) => {
                    source.buffer = buffer;
                    gainNode.gain.value = volume;
                    source.start(0);
                    source.onended = () => {
                        audioSources.delete(id);
                        gainNodes.delete(id);
                        onEndCallback();
                    };
                },
                (e) => {
                    ui.notifications.error("An error occurred while decoding audio data");
                    console.log(url);
                    console.log(audioData);
                    console.log(e);
                    onEndCallback();
                });
        };
        try {
            request.send();
        }
        catch (e) {
            console.error("Error playing sound effect:", e);
            onEndCallback();
        }
    }
    
    async function playSfx(url, volume=0.5) {
        // Invoke the playAudio function with the provided parameters and wait for it to complete vis the onEndCallback
        let finishedPromise = new Promise(async (resolve) => {
            let onEndCallback = () => {
                resolve();
            };
            // Attach base url
            if (!url.startsWith("http")) {
                url = `${window.location.origin}/systems/kitchen-sink/${url}`;
            }
            
            await playAudio(foundry.utils.randomID(), url, onEndCallback, volume);
        });
        return finishedPromise;
    }
    game.system.utils.playSfx = playSfx;
}
