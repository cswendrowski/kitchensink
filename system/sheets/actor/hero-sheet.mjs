import KitchenSinkDocumentSheet from "../kitchen-sink-sheet.mjs";
import KitchenSinkActorSheet from "../kitchen-sink-actor-sheet.mjs";
import KitchenSinkRoll from "../../rolls/roll.mjs";

export default class HeroSheet extends KitchenSinkActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["kitchen-sink", "sheet", "handlebars-sheet", "actor", "hero-sheet"],
            tabs: [
                {navSelector: ".pages", contentSelector: ".pages-container", initial: "main"},
                {navSelector: ".tabs", contentSelector: ".tabs-container", initial: "description"},
                { navSelector: ".info-nav", contentSelector: ".info-container", initial: "info" },
                { navSelector: ".stats-nav", contentSelector: ".stats-container", initial: "stats" },
                { navSelector: ".equipment-nav", contentSelector: ".equipment-container", initial: "equipment" },
            ],
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get template() {
        const editMode = this.object.getFlag('kitchen-sink', 'edit-mode') ?? true;
        return editMode ? `systems/kitchen-sink/system/templates/actor/${this.object.type}-config.hbs` : `systems/kitchen-sink/system/templates/actor/${this.object.type}.hbs`;
    }

    /* -------------------------------------------- */

    _getHeaderButtons() {
        return [
            {
                class: 'kitchen-sink-toggle-edit-mode',
                label: game.i18n.localize('Edit'),
                icon: 'fas fa-edit',
                onclick: async (e) => {
                    await this._toggleEditMode(e)
                }
            },
            ...super._getHeaderButtons()
        ]
    }

    async _toggleEditMode(event) {
        event.preventDefault()

        const currentValue = this.object.getFlag('kitchen-sink', 'edit-mode')
        await this.object.setFlag('kitchen-sink', 'edit-mode', !currentValue)
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        const context = await super.getData();
        context.editMode = this.object.getFlag('kitchen-sink', 'edit-mode') ?? true;
        context.backgroundHTML = await TextEditor.enrichHTML(
                    this.object.system.background,
                    {async: true, secrets: this.object.isOwner}
                ); 
        context.typeChoices = {
            A: "Hero.Type.A",
            B: "Hero.Type.B",
            C: "Hero.Type.C",
        };
        // ExperienceTrack Pip Data
        const experiencetrackCurrentValue = this.object.system.experiencetrack ?? 0;
        const experiencetrackMaxFunc = (system) => {
            return 10;
        };
        const experiencetrackInitialFunc = (system) => {
            return 0;
        };
        context.experiencetrack = Array.from({length: experiencetrackMaxFunc(this.object.system)}, (_, i) => {
            return {checked: i < experiencetrackCurrentValue};
        });
        context.experiencetrackMax = experiencetrackMaxFunc(this.object.system);
        context.experiencetrackInitial = experiencetrackInitialFunc(this.object.system);
        // DamageTrack Pip Data
        const damagetrackCurrentValue = this.object.system.damagetrack ?? 0;
        const damagetrackMaxFunc = (system) => {
            return 5;
        };
        const damagetrackInitialFunc = (system) => {
            return 0;
        };
        context.damagetrack = Array.from({length: damagetrackMaxFunc(this.object.system)}, (_, i) => {
            return {checked: i < damagetrackCurrentValue};
        });
        context.damagetrackMax = damagetrackMaxFunc(this.object.system);
        context.damagetrackInitial = damagetrackInitialFunc(this.object.system);
        
        // Damage DamageTrack Data
        const damageMaxFunc = (system) => {
            return 5;
        };
        const damageTypes = ["empty","bashing","lethal","aggravated",];
        context.damage = [];

        // There are 5 tiers of damage. Each tier is a different color. If we have less than 5 types, we skip some of the center tiers - 3 types = tier 1, 3, 5 for instance.
        let damageAssignedTiers = [];
        switch (damageTypes.length) {
            case 1:
                damageAssignedTiers = ["tier-5"];
                break;
            case 2:
                damageAssignedTiers = ["tier-1", "tier-5"];
                break;
            case 3:
                damageAssignedTiers = ["tier-1", "tier-3", "tier-5"];
                break;
            case 4:
                damageAssignedTiers = ["tier-1", "tier-2", "tier-4", "tier-5"];
                break;
            case 5:
                damageAssignedTiers = ["tier-1", "tier-2", "tier-3", "tier-4", "tier-5"];
                break;
            default:
                console.error("Unsupported number of damage types");
                break;
        }

        for (let j = damageTypes.length - 1; j >= 0; j--) {
            for (let i = 0; i < this.object.system.damage[damageTypes[j]]; i++) {
                let type = damageTypes[j];
                let tier = type === "empty" ? "empty" : damageAssignedTiers[j];
                context.damage.push({type: type, tier: tier});
            }
        }
        // FlipACoin Action Info
        const flipacoinDisabledFunc = (system) => {
            return false
        };
        const flipacoinHiddenFunc = (system) => {
            return false
        };
        context.flipacoinAction = {
            label: "Hero.FlipACoin",
            disabled: flipacoinDisabledFunc(this.object.system),
            hidden: flipacoinHiddenFunc(this.object.system)
        };

        // LevelUp Action Info
        const levelupDisabledFunc = (system) => {
            return system.experience.value < 10 
        };
        const levelupHiddenFunc = (system) => {
            return false
        };
        context.levelupAction = {
            label: "Hero.LevelUp",
            disabled: levelupDisabledFunc(this.object.system),
            hidden: levelupHiddenFunc(this.object.system)
        };

        // Increment Action Info
        const incrementDisabledFunc = (system) => {
            return false
        };
        const incrementHiddenFunc = (system) => {
            return false
        };
        context.incrementAction = {
            label: "Hero.Increment",
            disabled: incrementDisabledFunc(this.object.system),
            hidden: incrementHiddenFunc(this.object.system)
        };

        // Decrement Action Info
        const decrementDisabledFunc = (system) => {
            return false
        };
        const decrementHiddenFunc = (system) => {
            return false
        };
        context.decrementAction = {
            label: "Hero.Decrement",
            disabled: decrementDisabledFunc(this.object.system),
            hidden: decrementHiddenFunc(this.object.system)
        };

        // Reset Action Info
        const resetDisabledFunc = (system) => {
            return false
        };
        const resetHiddenFunc = (system) => {
            return false
        };
        context.resetAction = {
            label: "Hero.Reset",
            disabled: resetDisabledFunc(this.object.system),
            hidden: resetHiddenFunc(this.object.system)
        };

        // Increment2 Action Info
        const increment2DisabledFunc = (system) => {
            return false
        };
        const increment2HiddenFunc = (system) => {
            return false
        };
        context.increment2Action = {
            label: "Hero.Increment2",
            disabled: increment2DisabledFunc(this.object.system),
            hidden: increment2HiddenFunc(this.object.system)
        };

        // Decrement2 Action Info
        const decrement2DisabledFunc = (system) => {
            return false
        };
        const decrement2HiddenFunc = (system) => {
            return false
        };
        context.decrement2Action = {
            label: "Hero.Decrement2",
            disabled: decrement2DisabledFunc(this.object.system),
            hidden: decrement2HiddenFunc(this.object.system)
        };

        // Reset2 Action Info
        const reset2DisabledFunc = (system) => {
            return false
        };
        const reset2HiddenFunc = (system) => {
            return false
        };
        context.reset2Action = {
            label: "Hero.Reset2",
            disabled: reset2DisabledFunc(this.object.system),
            hidden: reset2HiddenFunc(this.object.system)
        };

        // Recover Action Info
        const recoverDisabledFunc = (system) => {
            return system.stagger.value < 1 
        };
        const recoverHiddenFunc = (system) => {
            return false
        };
        context.recoverAction = {
            label: "Hero.Recover",
            disabled: recoverDisabledFunc(this.object.system),
            hidden: recoverHiddenFunc(this.object.system)
        };

        // Refill Action Info
        const refillDisabledFunc = (system) => {
            return system.mana.value === system.mana?.max 
        };
        const refillHiddenFunc = (system) => {
            return false
        };
        context.refillAction = {
            label: "Hero.Refill",
            disabled: refillDisabledFunc(this.object.system),
            hidden: refillHiddenFunc(this.object.system)
        };

        // Heal Action Info
        const healDisabledFunc = (system) => {
            return false
        };
        const healHiddenFunc = (system) => {
            return false
        };
        context.healAction = {
            label: "Hero.Heal",
            disabled: healDisabledFunc(this.object.system),
            hidden: healHiddenFunc(this.object.system)
        };

        // Roll Action Info
        const rollDisabledFunc = (system) => {
            return false
        };
        const rollHiddenFunc = (system) => {
            return false
        };
        context.rollAction = {
            label: "Hero.Roll",
            disabled: rollDisabledFunc(this.object.system),
            hidden: rollHiddenFunc(this.object.system)
        };

        // HealDamageTrack Action Info
        const healdamagetrackDisabledFunc = (system) => {
            return false
        };
        const healdamagetrackHiddenFunc = (system) => {
            return false
        };
        context.healdamagetrackAction = {
            label: "Hero.HealDamageTrack",
            disabled: healdamagetrackDisabledFunc(this.object.system),
            hidden: healdamagetrackHiddenFunc(this.object.system)
        };

        // TakeBashing Action Info
        const takebashingDisabledFunc = (system) => {
            return false
        };
        const takebashingHiddenFunc = (system) => {
            return false
        };
        context.takebashingAction = {
            label: "Hero.TakeBashing",
            disabled: takebashingDisabledFunc(this.object.system),
            hidden: takebashingHiddenFunc(this.object.system)
        };

        context.SpellItemActions = [
        ];
        context.SkillItemActions = [
            {
                label: "Roll",
                icon: "fa-solid fa-bolt",
                action: "roll",
                color: "#000000"
            },
            {
                label: "SimpleFightRoll",
                icon: "fa-solid fa-bolt",
                action: "simplefightroll",
                color: "#000000"
            }
        ];
        context.EquipmentItemActions = [
        ];
        context.EquipmentItemActions = [
        ];
        context.PotionItemActions = [
            {
                label: "Use",
                icon: "fa-solid fa-flask-round-potion",
                action: "use",
                color: "#000000"
            }
        ];
        context.armorHasContentLink = this.object.system.armor?.uuid != undefined;
        context.armorContentLink = await TextEditor.enrichHTML(`@UUID[${this.object.system.armor?.uuid}]`);
        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (this.documentType === "Actor") {
            // Find the outer window and attach edit mode class
            const outer = html.closest(".window-app")[0];
            const editMode = this.object.getFlag('kitchen-sink', 'edit-mode') ?? true;
            if (editMode && !outer.classList.contains("edit-mode")) {
                outer.classList.add("edit-mode");
            } else if (!editMode && outer.classList.contains("edit-mode")) {
                outer.classList.remove("edit-mode");
            }
        }

        // Actions
        html.find(".action").click(this._onAction.bind(this));
    }

    /* -------------------------------------------- */

    /** @override */
    get defaultBackground() {
        return "texture";
    }

    /* -------------------------------------------- */

    async _onAction(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        switch ( action ) {
            case "toggle-calculator": this._onToggleCalculator(event); break;
            case "calc-mode": this._onCalculatorModeSwap(event, action); break;
            case "calc-submit": this._onCalculatorSubmit(event); break;
            case "flipacoin": this._onFlipACoinAction(event, this.object.system); break;
            case "levelup": this._onLevelUpAction(event, this.object.system); break;
            case "increment": this._onIncrementAction(event, this.object.system); break;
            case "decrement": this._onDecrementAction(event, this.object.system); break;
            case "reset": this._onResetAction(event, this.object.system); break;
            case "increment2": this._onIncrement2Action(event, this.object.system); break;
            case "decrement2": this._onDecrement2Action(event, this.object.system); break;
            case "reset2": this._onReset2Action(event, this.object.system); break;
            case "recover": this._onRecoverAction(event, this.object.system); break;
            case "refill": this._onRefillAction(event, this.object.system); break;
            case "heal": this._onHealAction(event, this.object.system); break;
            case "roll": this._onRollAction(event, this.object.system); break;
            case "healdamagetrack": this._onHealDamageTrackAction(event, this.object.system); break;
            case "takebashing": this._onTakeBashingAction(event, this.object.system); break;
        }
    }

    
    /* -------------------------------------------- */

    async _onFlipACoinAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        let result = await new KitchenSinkRoll("d2", {}).roll();
        let resultText = "Heads";
        if (result.total === 1 ) {
            resultText = "Tails";
        }
        // Create the chat message
        const CoinFlipDescription = context.object.description ?? context.object.system.description;
        const CoinFlipContext = { 
            cssClass: "kitchen-sink CoinFlip",
            document: context.object,
            description: CoinFlipDescription,
            hasDescription: CoinFlipDescription!= "",
            parts: [
                { isRoll: false, label: "Result Text", value: resultText, wide: false, hasValue: resultText != "" },
                { isRoll: true, label: "Result", value: result, wide: true, tooltip: await result.getTooltip() },
            ],
            tags: [
            ]
        };
        const CoinFlipContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", CoinFlipContext);
        const CoinFlipChatFlavor = (system) => {
            return ""
        }
        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: CoinFlipContent,
            flavor: CoinFlipChatFlavor(context.object.system),
            type: CoinFlipContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
            rolls: Array.from(CoinFlipContext.parts.filter(x => x.isRoll).map(x => x.value)),
        });
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onLevelUpAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.experience.value"] = context.object.system.experience.value - 10;
        update["system.level"] = context.object.system.level + 1;
        if (selfDeleted) {
            ui.notifications.error("Cannot update a deleted document");
        }
        else if (Object.keys(update).length > 0) {
            await document.update(update);
            context.object.system = document.system;
        }
        update = {};
        await this.function_Print(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, context.object.system.level)
        let amount = await this.function_FightFightFight(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, context.object.system.level);
        console.log("Leveled up to Level " + context.object.system.level + " with a Fight bonus of " + amount)
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onIncrementAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.count"] = context.object.system.count + 1;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onDecrementAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.count"] = context.object.system.count - 1;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onResetAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.count"] = 0;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onIncrement2Action(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.count2"] = context.object.system.count2 + context.object.system.fancycounteramount;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onDecrement2Action(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.count2"] = context.object.system.count2 - context.object.system.fancycounteramount;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onReset2Action(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.count2"] = 0;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onRecoverAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        if ( context.object.system.stagger.temp > 0 ) {
            update["system.stagger.temp"] = context.object.system.stagger.temp - context.object.system.endure.mod;

            if ( update["system.stagger.temp"] < 0 ) {
                // Apply the remainder to the system property
                update["system.stagger.value"] = context.object.system.stagger.value + update["system.stagger.temp"];
                update["system.stagger.temp"] = 0;
            }
        }
        else {
            update["system.stagger.value"] = context.object.system.stagger.value - context.object.system.endure.mod;
        }
        if (context.object.system.stagger.value < 0 ) {
            update["system.stagger.value"] = 0;
        }
        if (selfDeleted) {
            ui.notifications.error("Cannot update a deleted document");
        }
        else if (Object.keys(update).length > 0) {
            await document.update(update);
            context.object.system = document.system;
        }
        update = {};
        // Create the chat message
        const StaggerDescription = context.object.description ?? context.object.system.description;
        const StaggerContext = { 
            cssClass: "kitchen-sink Stagger",
            document: context.object,
            description: StaggerDescription,
            hasDescription: StaggerDescription!= "",
            parts: [
                { isRoll: false, label: "Stagger", value: context.object.system.stagger.value, wide: false, hasValue: context.object.system.stagger.value != "" },
            ],
            tags: [
            ]
        };
        const StaggerContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", StaggerContext);
        const StaggerChatFlavor = (system) => {
            return ("Staggered! " + 2 + " Remaining: " + context.object.system.stagger.value)
        }
        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: StaggerContent,
            flavor: StaggerChatFlavor(context.object.system),
            type: StaggerContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
            rolls: Array.from(StaggerContext.parts.filter(x => x.isRoll).map(x => x.value)),
        });
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onRefillAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        update["system.mana.value"] = context.object.system.mana?.max;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onHealAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        let amount = await new KitchenSinkRoll("(" + `@endure[Endure]` + ")" + "d6", {"endure": context.object.system.endure.mod ?? 0, }).roll();
        update["system.hp.value"] = context.object.system.hp.value + amount._total;
        // Create the chat message
        const HealedDescription = context.object.description ?? context.object.system.description;
        const HealedContext = { 
            cssClass: "kitchen-sink Healed",
            document: context.object,
            description: HealedDescription,
            hasDescription: HealedDescription!= "",
            parts: [
                { isRoll: true, label: "Amount", value: amount, wide: true, tooltip: await amount.getTooltip() },
            ],
            tags: [
            ]
        };
        const HealedContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", HealedContext);
        const HealedChatFlavor = (system) => {
            return ""
        }
        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: HealedContent,
            flavor: HealedChatFlavor(context.object.system),
            type: HealedContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
            rolls: Array.from(HealedContext.parts.filter(x => x.isRoll).map(x => x.value)),
        });
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onRollAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        let levelToBonus = [1, 2, 4, 6, 8];
        let itemBonus = 0;
        for (const skill of context.object.system.skills ?? []) {
            itemBonus += skill.system.skillmod;
        }
        embeddedUpdate["context.object.system.skills"] = context.object.system.skills;
        let levelBonusRoll = await new KitchenSinkRoll("d6" + "+" + `@leveltobonus[Level To Bonus]` + "+" + "@itembonus[Item Bonus]", {"leveltobonus": levelToBonus[1] ?? 0, "itembonus": itemBonus ?? 0}).roll();
        // Create the chat message
        const LevelBonusDescription = context.object.description ?? context.object.system.description;
        const LevelBonusContext = { 
            cssClass: "kitchen-sink LevelBonus",
            document: context.object,
            description: LevelBonusDescription,
            hasDescription: LevelBonusDescription!= "",
            parts: [
                { isRoll: true, label: "Level Bonus Roll", value: levelBonusRoll, wide: true, tooltip: await levelBonusRoll.getTooltip() },
            ],
            tags: [
            ]
        };
        const LevelBonusContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", LevelBonusContext);
        const LevelBonusChatFlavor = (system) => {
            return ""
        }
        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: LevelBonusContent,
            flavor: LevelBonusChatFlavor(context.object.system),
            type: LevelBonusContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
            rolls: Array.from(LevelBonusContext.parts.filter(x => x.isRoll).map(x => x.value)),
        });
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onHealDamageTrackAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        if (context.object.system.damage?.bashing > 0 ) {
            update["system.damage?.bashing"] = context.object.system.damage?.bashing - 1;
            update["system.damage?.empty"] = context.object.system.damage?.empty + 1;
        }
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    async _onTakeBashingAction(event, system) {
        event.preventDefault();
        let update = {};
        let embeddedUpdate = {};
        let parentUpdate = {};
        let parentEmbeddedUpdate = {};
        let selfDeleted = false;
        let rerender = false;
        let document = this.document;
        const context = {
            object: this.object,
        };
        const amount = 5;
        if (context.object.system.damage?.bashing < amount ) {
            update["system.damage?.bashing"] = context.object.system.damage?.bashing + 1;
            update["system.damage?.empty"] = context.object.system.damage?.empty - 1;
        }
        const roll = await new Roll("1d10").roll();
        roll.toMessage({flavor: "Bashing Damage"});
        update["system.damage?.bashing"] = context.object.system.damage?.bashing + roll._total;
        if (!selfDeleted && Object.keys(update).length > 0) {
            await this.object.update(update);
            rerender = true;
        }
        if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
            for (let key of Object.keys(embeddedUpdate)) {
                await this.object.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
            }
            rerender = true;
        }
        if (Object.keys(parentUpdate).length > 0) {
            await this.object.parent.update(parentUpdate);
            rerender = true;
        }
        if (Object.keys(parentEmbeddedUpdate).length > 0) {
            for (let key of Object.keys(parentEmbeddedUpdate)) {
                await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
            }
        }
        if (rerender) {
            this.render();
        }
    }

    /* -------------------------------------------- */

    /** @override */
    async handleTableRowAction(item, action) {
        switch ( action ) {
            case "flipacoin": this._onFlipACoinAction(event, item.system); break;
            case "levelup": this._onLevelUpAction(event, item.system); break;
            case "increment": this._onIncrementAction(event, item.system); break;
            case "decrement": this._onDecrementAction(event, item.system); break;
            case "reset": this._onResetAction(event, item.system); break;
            case "increment2": this._onIncrement2Action(event, item.system); break;
            case "decrement2": this._onDecrement2Action(event, item.system); break;
            case "reset2": this._onReset2Action(event, item.system); break;
            case "recover": this._onRecoverAction(event, item.system); break;
            case "refill": this._onRefillAction(event, item.system); break;
            case "heal": this._onHealAction(event, item.system); break;
            case "roll": this._onRollAction(event, item.system); break;
            case "healdamagetrack": this._onHealDamageTrackAction(event, item.system); break;
            case "takebashing": this._onTakeBashingAction(event, item.system); break;
        }
    }

    /* -------------------------------------------- */

    _onToggleCalculator(event) {
        const calculator = event.currentTarget.closest(".form-group").querySelector(".calculator");
        if (calculator.style.display === "block") {
            calculator.style.display = "none";
        } else {
            // Find the window app
            const windowApp = event.currentTarget.closest(".window-app");
            const rect = windowApp.getBoundingClientRect();

            // Get the bounding box of the button too
            const button = event.currentTarget.getBoundingClientRect();

            // Calculate relative position
            const relativeX = button.left - rect.left;
            const relativeY = button.top - rect.top + 26;
            calculator.style.position = "absolute";
            calculator.style.top = `${relativeY}px`;
            calculator.style.left = `${relativeX}px`;
            calculator.style.display = "block";
        }
    }

    /* -------------------------------------------- */

    _onCalculatorModeSwap(event, mode) {
        event.preventDefault();
        const calculator = event.currentTarget.closest(".form-group").querySelector(".calculator");
        const modeButtons = calculator.querySelectorAll(".mode-button");
        for (let button of modeButtons) {
            button.classList.remove("active");
        }
        event.currentTarget.classList.add("active");
        calculator.dataset.mode = mode;
    }

    /* -------------------------------------------- */

    _onCalculatorSubmit(event) {
        const calculator = event.currentTarget.closest(".calculator");

        // Get the mode
        const modeButtons = calculator.querySelectorAll(".mode-button");
        let mode = "add";
        for (let button of modeButtons) {
            if (button.classList.contains("active")) {
                mode = button.dataset.mode;
            }
        }

        // Get the number
        const input = calculator.querySelector("input");
        const number = parseInt(input.value);

        // Get the attribute name
        const formGroup = calculator.closest(".form-group");
        const attribute = formGroup.dataset.name;

        let property = event.currentTarget.closest(".property");
        let isResourceExp = property.classList.contains("resourceExp");

        const currentValue = isResourceExp ? foundry.utils.getProperty(this.object, attribute + ".value") : foundry.utils.getProperty(this.object, attribute);
        const updateAttribute = isResourceExp ? attribute + ".value" : attribute;
        const update = {};
        if (mode === "add") {
            update[updateAttribute] = currentValue + number;
        }
        else if (mode === "subtract") {
            if (isResourceExp) {
                const temp = foundry.utils.getProperty(this.object, attribute + ".temp");
                update[attribute + ".temp"] = temp - number;

                if (temp - number < 0) {
                    update[attribute + ".value"] = currentValue + (temp - number);
                    update[attribute + ".temp"] = 0;
                }
            }
            else {
                update[updateAttribute] = currentValue - number;
            }
        }
        else if (mode === "multiply") {
            update[updateAttribute] = currentValue * number;
        }
        else if (mode === "divide") {
            update[updateAttribute] = currentValue / number;
        }
        this.object.update(update);

        // Close the calculator
        calculator.style.display = "none";
    }

    /* -------------------------------------------- */

    /** @override */
    async handleItemDrop(item) {
        switch ( item.type ) {
            case "spell": {
                            Item.createDocuments([item], {parent: this.object})
                            break;
                        }
            case "skill": {
                            Item.createDocuments([item], {parent: this.object})
                            break;
                        }
            case "equipment": {
                            Item.createDocuments([item], {parent: this.object})
                            break;
                        }
            case "equipment": {
                            Item.createDocuments([item], {parent: this.object})
                            break;
                        }
            case "potion": {
                            Item.createDocuments([item], {parent: this.object})
                            break;
                        }
        }
    }
}
