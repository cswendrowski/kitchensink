import VueRenderingMixin from './VueRenderingMixin.mjs';
import { ActiveEffectApp } from "./components/components.vue.es.mjs";
const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;
export default class KitchenSinkEffectVueSheet extends VueRenderingMixin(foundry.applications.api.DocumentSheetV2) {
    
    vueParts = {
        "active-effect": {
            component: ActiveEffectApp,
            template: "<active-effect :context=\"context\">Vue rendering for sheet failed.</active-effect>"
        }
    };

    _arrayEntryKey = 0;
    _renderKey = 0;
    
    
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["kitchen-sink", "sheet", "vue-sheet", "active-effect", "active-effect-sheet"],
        viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
        editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        position: {
            width: 600,
            height: 600,
        },
        window: {
            resizable: true,
            title: "Active Effect"
        },
        tag: "form",
        actions: {
            onEditImage: this._onEditImage
        },
        changeActions: {
        },
        // Custom property that's merged into this.options
        dragDrop: [
        ],
        form: {
            submitOnChange: true,
            submitOnClose: true,
            closeOnSubmit: false
        }
    };

    /* -------------------------------------------- */
    
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        this.object = this.document.toObject();
        context.effect = this.object;
        context.descriptionHTML = await TextEditor.enrichHTML(this.object.description, {secrets: this.object.isOwner});
    
        // Status Conditions
        const statuses = CONFIG.statusEffects.map(s => {
          return {
            id: s.id,
            label: game.i18n.localize(s.name),
            selected: context.effect.statuses.includes(s.id) ? "selected" : ""
          };
        });
        context.statuses = statuses;
        if ( context.effect.origin ) {
            context.originLink = await TextEditor.enrichHTML("@UUID[" + context.effect.origin + "]");
        }
        context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
            obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
            return obj;
        });
        
        function setValue(obj, access, value, mode){
            if ( typeof(access)=='string' ) {
                access = access.split('.');
            }
            // Split up an access path into sub-objects, such as "system.attribute.value" => "system": {"attribute": {"value": ...}}
            if ( access.length > 1 ) {
                const key = access.shift();
                if ( !obj[key] ) obj[key] = {};
                setValue(obj[key], access, value, mode);
            }
            else {
                obj[access[0]] = value;
                obj[access[0] + "-mode"] = mode;
            }
        }

        // Turn the changes into the friendlier format
        for ( const change of context.effect.changes ) {
            setValue(context, change.key, change.value, change.mode);
        }
        
        // Output initialization
        const vueContext = {
            // Validates both permissions and compendium status
            editable: this.isEditable,
            owner: this.document.isOwner,
            limited: this.document.limited,

            // Add the document.
            object: context.effect,
            document: this.document,

            // Add the data to context.data for easier access, as well as flags.
            system: this.document.system,
            flags: this.document.flags,

            // Editors
            editors: {},

            // Force re-renders. Defined in the vue mixin.
            _renderKey: this._renderKey ?? 0,
            _arrayEntryKey: this._arrayEntryKey ?? 0,
            // tabs: this._getTabs(options.parts),
        };
        
        await this._enrichEditor(vueContext, "description");
        
        const modes = CONST.ACTIVE_EFFECT_MODES;
        const numberModes = [modes.MULTIPLY, modes.ADD, modes.DOWNGRADE, modes.UPGRADE, modes.OVERRIDE];
        const stringModes = [modes.OVERRIDE];
        const booleanModes = [modes.OVERRIDE];

        vueContext.numberModes = numberModes.reduce((obj, mode) => {
            obj.push({
                value: mode,
                label: context.modes[mode]
            });
            return obj;
        }, []);
        vueContext.numberModes.push({
            value: 0,
            label: game.i18n.localize("EFFECTS.AddOnce")
        });
        vueContext.stringModes = stringModes.map((mode) => ({
            value: mode,
            label: context.modes[mode]
        }));
        vueContext.booleanModes = booleanModes.map((mode) => ({
            value: mode,
            label: context.modes[mode]
        }));
        vueContext.resourceModes = [
            { value: 0, label: "Add Once" }
        ];
        vueContext.trackerModes = [
            { value: 0, label: "Add Once" }
        ];

        console.dir(vueContext);
        return vueContext;
    }
    
    
    async _enrichEditor(context, field) {
        const enrichmentOptions = {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: {},
            // Relative UUID resolution
            relativeTo: this.document
        };

        const editorOptions = {
            toggled: true,
            collaborate: true,
            documentUUID: this.document.uuid,
            height: 300
        };

        const editorValue = this.document.system?.[field] ?? foundry.utils.getProperty(this.document.system, field);
        context.editors[`${field}`] = {
            enriched: await TextEditor.enrichHTML(editorValue, enrichmentOptions),
            element: foundry.applications.elements.HTMLProseMirrorElement.create({
                ...editorOptions,
                name: `system.${field}`,
                value: editorValue ?? ""
            })
        };
    }
    
    /* -------------------------------------------- */
    
    _prepareSubmitData(event, form, formData) {
        // We don't modify the image via the sheet itself, so we can remove it from the submit data to avoid errors.
        delete formData.object.img;
        return super._prepareSubmitData(event, form, formData);
    }

    /* -------------------------------------------- */

    async _updateObject(event, formData) {
        let ae = foundry.utils.duplicate(this.object);
        ae.name = formData.name;
        ae.description = formData.description;
        ae.origin = formData.origin;
        ae.disabled = formData.disabled;
        ae.transfer = formData.transfer;

        if ( !ae.flags["kitchen-sink"] ) {
            ae.flags["kitchen-sink"] = {};
        }

        // Retrieve the existing effects.
        const effectData = await this.getData();
        let changes = effectData?.data?.changes ? effectData.data.changes : [];

        // Build an array of effects from the form data
        let newChanges = [];

        function addChange(documentName, key, customMode) {
            const value = foundry.utils.getProperty(formData, key);
            if ( !value ) {
                // If there is a current change for this key, remove it.
                changes = changes.filter(c => c.key !== key);
                return;
            }
            const mode = foundry.utils.getProperty(formData, key + "-mode");
            newChanges.push({
                key: key,
                value: value,
                mode: mode
            });
            if ( customMode ) ae.flags["kitchen-sink"][key + "-custommode"] = customMode;
        }

        addChange("hero", "hero.system.herotype");
        addChange("hero", "hero.system.damagetype");
        addChange("hero", "hero.system.summary");
        addChange("hero", "hero.system.text2");
        addChange("hero", "hero.system.backgroundtext");
        addChange("hero", "hero.system.fate.min");
        addChange("hero", "hero.system.fate.value", 1);
        addChange("hero", "hero.system.fate.temp", 1);
        addChange("hero", "hero.system.fate.max");
        addChange("hero", "hero.system.shield.min");
        addChange("hero", "hero.system.shield.value", 1);
        addChange("hero", "hero.system.shield.temp", 1);
        addChange("hero", "hero.system.shield.max");
        addChange("hero", "hero.system.wounds.min");
        addChange("hero", "hero.system.wounds.value", 1);
        addChange("hero", "hero.system.wounds.temp", 1);
        addChange("hero", "hero.system.wounds.max");
        addChange("hero", "hero.system.heat.min");
        addChange("hero", "hero.system.heat.value", 1);
        addChange("hero", "hero.system.heat.temp", 1);
        addChange("hero", "hero.system.heat.max");
        addChange("hero", "hero.system.time.min");
        addChange("hero", "hero.system.time.value", 1);
        addChange("hero", "hero.system.time.temp", 1);
        addChange("hero", "hero.system.time.max");
        addChange("hero", "hero.system.outoftime");
        addChange("hero", "hero.system.level", 1);
        addChange("hero", "hero.system.level");
        addChange("hero", "hero.system.plain.min");
        addChange("hero", "hero.system.plain.value", 1);
        addChange("hero", "hero.system.plain.temp", 1);
        addChange("hero", "hero.system.plain.max");
        addChange("hero", "hero.system.experiencetrack");
        addChange("hero", "hero.system.experience.min");
        addChange("hero", "hero.system.experience.value", 1);
        addChange("hero", "hero.system.experience.temp", 1);
        addChange("hero", "hero.system.experience.max");
        addChange("hero", "hero.system.fight.value");
        addChange("hero", "hero.system.fight.max");
        addChange("hero", "hero.system.flight.value");
        addChange("hero", "hero.system.flight.max");
        addChange("hero", "hero.system.endure.value");
        addChange("hero", "hero.system.endure.max");
        addChange("hero", "hero.system.persuade.value");
        addChange("hero", "hero.system.persuade.max");
        addChange("hero", "hero.system.grit.value");
        addChange("hero", "hero.system.grit.max");
        addChange("hero", "hero.system.slowed");
        addChange("hero", "hero.system.dazed");
        addChange("hero", "hero.system.count", 1);
        addChange("hero", "hero.system.count");
        addChange("hero", "hero.system.count2", 1);
        addChange("hero", "hero.system.count2");
        addChange("hero", "hero.system.fancycounteramount", 1);
        addChange("hero", "hero.system.fancycounteramount");
        addChange("hero", "hero.system.something", 1);
        addChange("hero", "hero.system.something");
        addChange("hero", "hero.system.anotherthing", 1);
        addChange("hero", "hero.system.anotherthing");
        addChange("hero", "hero.system.hp.value", 1);
        addChange("hero", "hero.system.hp.max");
        addChange("hero", "hero.system.defense", 1);
        addChange("hero", "hero.system.defense");
        addChange("hero", "hero.system.stealth", 1);
        addChange("hero", "hero.system.stealth");
        addChange("hero", "hero.system.stagger.value", 1);
        addChange("hero", "hero.system.stagger.max");
        addChange("hero", "hero.system.mana.value", 1);
        addChange("hero", "hero.system.mana.max");
        addChange("hero", "hero.system.damagetrack");
        addChange("hero", "hero.system.crisis", 1);
        addChange("hero", "hero.system.crisis");
        addChange("hero", "hero.system.level2", 1);
        addChange("hero", "hero.system.level2");
        addChange("hero", "hero.system.damage");
        addChange("hero", "hero.system.availableskilllevels", 1);
        addChange("hero", "hero.system.availableskilllevels");
        addChange("hero", "hero.system.armor");
        addChange("hero", "hero.system.armors");
        addChange("hero", "hero.system.weapons");
        addChange("hero", "hero.system.potion");
        addChange("hero", "hero.system.spells");
        addChange("hero", "hero.system.skills");
        addChange("npc", "npc.system.level", 1);
        addChange("npc", "npc.system.level");
        addChange("npc", "npc.system.monster.value");
        addChange("npc", "npc.system.monster.max");
        addChange("npc", "npc.system.defense", 1);
        addChange("npc", "npc.system.defense");
        addChange("npc", "npc.system.armor");
        addChange("npc", "npc.system.equipment");

        // Update the existing changes to replace duplicates.
        for (let i = 0; i < changes.length; i++) {
            const newChange = newChanges.find(c => c.key == changes[i].key);
            if (newChange) {
                // Replace with the new change and update the array to prevent duplicates.
                changes[i] = newChange;
                newChanges = newChanges.filter(c => c.key != changes[i].key);
            }
        }

        // Apply the combined effect changes.
        ae.changes = changes.concat(newChanges);

        // Filter changes for empty form fields.
        ae.changes = ae.changes.filter(c => c.value !== null);

        await this.object.update(ae);

        // Rerender the parent sheets to update the effect lists.
        this.object.parent?.sheet?.render();
        if ( this.object.parent?.documentName === "Item" ) {
            this.object.parent?.parent?.applyActiveEffects();

            // Wait half a second
            await new Promise(r => setTimeout(r, 500));
            this.object.parent?.parent?.sheet?.render();
        }
    }
}
