import KitchenSinkActor from "../../documents/actor.mjs";
import KitchenSinkItem from "../../documents/item.mjs";
import UuidDocumentField from "../UuidDocumentField.mjs";

export default class NPCTypeDataModel extends foundry.abstract.DataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: false, blank: true, initial: ""}),
            level: new fields.NumberField({integer: true, initial: 4, min: 1, max: 7}),
            monster: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 0, initial: 0}),
                max: new fields.NumberField({integer: true, min: 0, initial: 100}),
            }),
            defense: new fields.NumberField({integer: true}),
            armor: new UuidDocumentField(),
        };
    }

    /* -------------------------------------------- */

};
