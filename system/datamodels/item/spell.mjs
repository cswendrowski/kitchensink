import KitchenSinkActor from "../../documents/actor.mjs";
import KitchenSinkItem from "../../documents/item.mjs";
import UuidDocumentField from "../UuidDocumentField.mjs";

export default class SpellTypeDataModel extends foundry.abstract.DataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: false, blank: true, initial: ""}),
            type: new fields.SchemaField({
                value: new fields.StringField({
                    choices: ["Attack", "Defense", "Healing"],
                    initial: "Attack"
                }),
                icon: new fields.StringField({initial: ""}),
                color: new fields.StringField({initial: "#ffffff"})
            }),
            class: new fields.SchemaField({
                value: new fields.StringField({
                    choices: ["None", "Fire", "Water", "Earth", "Air"],
                    initial: "None"
                }),
                icon: new fields.StringField({initial: ""}),
                color: new fields.StringField({initial: "#ffffff"})
            }),
            training: new fields.SchemaField({
                value: new fields.StringField({
                    choices: ["Basic", "Advanced", "Master"],
                    initial: "Basic"
                }),
                icon: new fields.StringField({initial: ""}),
                color: new fields.StringField({initial: "#ffffff"}),
                bonus: new fields.NumberField({initial: 0}),
                checkdc: new fields.NumberField({initial: 0})
            }),
            level: new fields.NumberField({integer: true}),
            cost: new fields.NumberField({integer: true}),
            summary: new fields.StringField({initial: ""}),
        };
    }

    /* -------------------------------------------- */

};
