export default class KitchenSinkEffectSheet extends ActiveEffectConfig {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["kitchen-sink", "sheet", "active-effect", "active-effect-sheet"],
            template: "systems/kitchen-sink/system/templates/active-effect-sheet.hbs",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "info"}],
            closeOnSubmit: false,
            submitOnChange: true
        });
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        const context = await super.getData();
        if ( context.effect.origin ) {
            context.originLink = await TextEditor.enrichHTML("@UUID[" + context.effect.origin + "]");
        }

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

        const modes = CONST.ACTIVE_EFFECT_MODES;
        const numberModes = [modes.MULTIPLY, modes.ADD, modes.DOWNGRADE, modes.UPGRADE, modes.OVERRIDE];
        const stringModes = [modes.OVERRIDE];
        const booleanModes = [modes.OVERRIDE];

        context.numberModes = numberModes.reduce((obj, mode) => {
            obj[mode] = context.modes[mode];
            return obj;
        }, {});
        context.stringModes = stringModes.reduce((obj, mode) => {
            obj[mode] = context.modes[mode];
            return obj;
        }, {});
        context.booleanModes = booleanModes.reduce((obj, mode) => {
            obj[mode] = context.modes[mode];
            return obj;
        }, {});
        context.resourceModes = {
            0: "Add Once"
        };
        context.trackerModes = {
            0: "Add Once"
        };

        return context;
    }

    /* -------------------------------------------- */

    async _updateObject(event, formData) {
        let ae = foundry.utils.duplicate(this.object);
        ae.name = formData.name;
        ae.img = formData.img;
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

        addChange("hero", "hero.system.stringfield");
        addChange("hero", "hero.system.numberfield");
        addChange("hero", "hero.system.booleanfield");
        addChange("hero", "hero.system.resourcefield.value", 1);
        addChange("hero", "hero.system.resourcefield.max");
        addChange("hero", "hero.system.trackerfield.min");
        addChange("hero", "hero.system.trackerfield.value", 1);
        addChange("hero", "hero.system.trackerfield.temp", 1);
        addChange("hero", "hero.system.trackerfield.max");
        addChange("hero", "hero.system.attributefield.value");
        addChange("hero", "hero.system.attributefield.max");
        addChange("hero", "hero.system.measuredtemplatefield");
        addChange("hero", "hero.system.datefield");
        addChange("hero", "hero.system.timefield");
        addChange("hero", "hero.system.datetimefield");
        addChange("hero", "hero.system.diefield");
        addChange("hero", "hero.system.skillstable");
        addChange("hero", "hero.system.singledocumentfield");
        addChange("hero", "hero.system.choicefield");
        addChange("hero", "hero.system.paperdollfield");
        addChange("hero", "hero.system.herotype.value");
        addChange("hero", "hero.system.damagetype.value");
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
        addChange("hero", "hero.system.timepassed");
        addChange("hero", "hero.system.outoftime");
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
        addChange("hero", "hero.system.count");
        addChange("hero", "hero.system.count2");
        addChange("hero", "hero.system.fancycounteramount");
        addChange("hero", "hero.system.something");
        addChange("hero", "hero.system.anotherthing");
        addChange("hero", "hero.system.hp.value", 1);
        addChange("hero", "hero.system.hp.max");
        addChange("hero", "hero.system.defense");
        addChange("hero", "hero.system.stealth");
        addChange("hero", "hero.system.stagger.value", 1);
        addChange("hero", "hero.system.stagger.max");
        addChange("hero", "hero.system.mana.value", 1);
        addChange("hero", "hero.system.mana.max");
        addChange("hero", "hero.system.damagetrack");
        addChange("hero", "hero.system.crisis");
        addChange("hero", "hero.system.level2");
        addChange("hero", "hero.system.damage");
        addChange("hero", "hero.system.availableskilllevels");
        addChange("hero", "hero.system.armor");
        addChange("hero", "hero.system.armors");
        addChange("hero", "hero.system.weapons");
        addChange("hero", "hero.system.potion");
        addChange("hero", "hero.system.spells");
        addChange("hero", "hero.system.skills");
        addChange("hero", "hero.system.vuetifyspells");
        addChange("npc", "npc.system.level");
        addChange("npc", "npc.system.monster.value");
        addChange("npc", "npc.system.monster.max");
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
