import KitchenSinkDocumentSheet from "../kitchen-sink-sheet.mjs";
import KitchenSinkActorSheet from "../kitchen-sink-actor-sheet.mjs";
import KitchenSinkRoll from "../../rolls/roll.mjs";

export default class SkillSheet extends KitchenSinkDocumentSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["kitchen-sink", "sheet", "handlebars-sheet", "item", "skill-sheet"],
            tabs: [
                {navSelector: ".pages", contentSelector: ".pages-container", initial: "main"},
                {navSelector: ".tabs", contentSelector: ".tabs-container", initial: "description"},
            ],
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get template() {
        const editMode = this.object.getFlag('kitchen-sink', 'edit-mode') ?? true;
        return editMode ? `systems/kitchen-sink/system/templates/item/${this.object.type}-config.hbs` : `systems/kitchen-sink/system/templates/item/${this.object.type}.hbs`;
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
        // Roll Action Info
        const rollDisabledFunc = (system) => {
            return false
        };
        const rollHiddenFunc = (system) => {
            return false
        };
        context.rollAction = {
            label: "Skill.Roll",
            disabled: rollDisabledFunc(this.object.system),
            hidden: rollHiddenFunc(this.object.system)
        };

        // SimpleFightRoll Action Info
        const simplefightrollDisabledFunc = (system) => {
            return false
        };
        const simplefightrollHiddenFunc = (system) => {
            return false
        };
        context.simplefightrollAction = {
            label: "Skill.SimpleFightRoll",
            disabled: simplefightrollDisabledFunc(this.object.system),
            hidden: simplefightrollHiddenFunc(this.object.system)
        };

        context.abilityParentChoices = {
            "" : "None",
            "system.fight": "Hero - Fight",
            "system.flight": "Hero - Flight"
        };
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
        return "topography";
    }

    /* -------------------------------------------- */

    async _onAction(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        switch ( action ) {
            case "toggle-calculator": this._onToggleCalculator(event); break;
            case "calc-mode": this._onCalculatorModeSwap(event, action); break;
            case "calc-submit": this._onCalculatorSubmit(event); break;
            case "roll": this._onRollAction(event, this.object.system); break;
            case "simplefightroll": this._onSimpleFightRollAction(event, this.object.system); break;
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
        let skill = 0;
        let answer = await new Promise((resolve, reject) => {

            const firstGm = game.users.find(u => u.isGM && u.active);
            const uuid = foundry.utils.randomID();

            // Setup a listener that will wait for this response
            game.socket.on("system.kitchen-sink", (data) => {
                if (data.type != "promptResponse" || data.uuid != uuid) return;

                // Resolve the promise with the data
                resolve(data.data);
            });

            game.socket.emit("system.kitchen-sink", {
                uuid: uuid,
                type: "prompt",
                userId: game.user.id,
                title: "Bonus",
                content: `<form><div class="form-group">
                    <label>Bonus</label>
                    <input type="number" name="bonus" value="0" />
                </div><div class="form-group">
                    <label>Has Advantage</label>
                    <input type="checkbox" name="hasadvantage" />
                </div></form>`,
            }, {recipients: [firstGm.id]});
        });;
        if (answer.hasadvantage ) {
            skill = context.object.system.skill;
            let abilityRoll = await new KitchenSinkRoll("d6" + "+" + `@ability[Ability - ${context.object.system.ability.replace("system.", "").replaceAll(".", " ").titleCase()}]` + "+" + "@skill[Skill]" + "+" + "@answerbonus[Bonus]", {"ability": foundry.utils.getProperty(context.object.parent, context.object.system.ability), "skill": skill ?? 0, "answerbonus": answer.bonus ?? 0}).roll();
            // Create the chat message
            const AbilityUseDescription = context.object.description ?? context.object.system.description;
            const AbilityUseContext = { 
                cssClass: "kitchen-sink AbilityUse",
                document: context.object,
                description: AbilityUseDescription,
                hasDescription: AbilityUseDescription!= "",
                parts: [
                    { isRoll: true, label: "Ability Roll", value: abilityRoll, wide: true, tooltip: await abilityRoll.getTooltip() },
                ],
                tags: [
                    { isRoll: false, label: "Ability", value: context.object.system.ability.replace("system", "").replaceAll(".", "").titleCase(), wide: false, hasValue: context.object.system.ability != "" },
                    { isRoll: false, label: "Skill", value: context.object.system.skill, wide: false, hasValue: context.object.system.skill != "" },
                ]
            };
            const AbilityUseContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", AbilityUseContext);
            const AbilityUseChatFlavor = (system) => {
                return ""
            }
            await ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content: AbilityUseContent,
                flavor: AbilityUseChatFlavor(context.object.system),
                type: AbilityUseContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
                rolls: Array.from(AbilityUseContext.parts.filter(x => x.isRoll).map(x => x.value)),
            });
        }
        else {
            let abilityRoll = await new KitchenSinkRoll("d6" + "+" + `@ability[Ability - ${context.object.system.ability.replace("system.", "").replaceAll(".", " ").titleCase()}]` + "+" + "@answerbonus[Bonus]", {"ability": foundry.utils.getProperty(context.object.parent, context.object.system.ability), "answerbonus": answer.bonus ?? 0}).roll();
            // Create the chat message
            const AbilityUseDescription = context.object.description ?? context.object.system.description;
            const AbilityUseContext = { 
                cssClass: "kitchen-sink AbilityUse",
                document: context.object,
                description: AbilityUseDescription,
                hasDescription: AbilityUseDescription!= "",
                parts: [
                    { isRoll: true, label: "Ability Roll", value: abilityRoll, wide: true, tooltip: await abilityRoll.getTooltip() },
                ],
                tags: [
                    { isRoll: false, label: "Ability", value: context.object.system.ability.replace("system", "").replaceAll(".", "").titleCase(), wide: false, hasValue: context.object.system.ability != "" },
                    { isRoll: false, label: "Skill", value: context.object.system.skill, wide: false, hasValue: context.object.system.skill != "" },
                ]
            };
            const AbilityUseContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", AbilityUseContext);
            const AbilityUseChatFlavor = (system) => {
                return ""
            }
            await ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content: AbilityUseContent,
                flavor: AbilityUseChatFlavor(context.object.system),
                type: AbilityUseContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
                rolls: Array.from(AbilityUseContext.parts.filter(x => x.isRoll).map(x => x.value)),
            });
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

    async _onSimpleFightRollAction(event, system) {
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
        if (context.object.parent.type == "hero") {
            let abilityRoll = await new KitchenSinkRoll("d6" + "+" + `@herofightmod[Hero Fight Mod]`, {"herofightmod": context.object.parent.system.fight.mod}).roll();
            // Create the chat message
            const AbilityUseDescription = context.object.description ?? context.object.system.description;
            const AbilityUseContext = { 
                cssClass: "kitchen-sink AbilityUse",
                document: context.object,
                description: AbilityUseDescription,
                hasDescription: AbilityUseDescription!= "",
                parts: [
                    { isRoll: true, label: "Ability Roll", value: abilityRoll, wide: true, tooltip: await abilityRoll.getTooltip() },
                ],
                tags: [
                    { isParagraph: true, value: "Fight" },
                    { isRoll: false, label: "Skill", value: context.object.system.skill, wide: false, hasValue: context.object.system.skill != "" },
                ]
            };
            const AbilityUseContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", AbilityUseContext);
            const AbilityUseChatFlavor = (system) => {
                return ""
            }
            await ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content: AbilityUseContent,
                flavor: AbilityUseChatFlavor(context.object.system),
                type: AbilityUseContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
                rolls: Array.from(AbilityUseContext.parts.filter(x => x.isRoll).map(x => x.value)),
            });
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

    /** @override */
    async handleTableRowAction(item, action) {
        switch ( action ) {
            case "roll": this._onRollAction(event, item.system); break;
            case "simplefightroll": this._onSimpleFightRollAction(event, item.system); break;
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
        }
    }
}
