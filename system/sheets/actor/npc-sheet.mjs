import KitchenSinkDocumentSheet from "../kitchen-sink-sheet.mjs";
import KitchenSinkActorSheet from "../kitchen-sink-actor-sheet.mjs";
import KitchenSinkRoll from "../../rolls/roll.mjs";

export default class NPCSheet extends KitchenSinkActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["kitchen-sink", "sheet", "handlebars-sheet", "actor", "npc-sheet"],
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
        context.EquipmentItemActions = [
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
        }
    }


    /* -------------------------------------------- */

    /** @override */
    async handleTableRowAction(item, action) {
        switch ( action ) {
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
            case "equipment": {
                            Item.createDocuments([item], {parent: this.object})
                            break;
                        }
        }
    }
}
