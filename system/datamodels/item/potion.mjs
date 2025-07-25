import KitchenSinkActor from "../../documents/actor.mjs";
import KitchenSinkItem from "../../documents/item.mjs";
import UuidDocumentField from "../UuidDocumentField.mjs";

export default class PotionTypeDataModel extends foundry.abstract.DataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: false, blank: true, initial: ""}),
            quantity: new fields.NumberField({integer: true}),
        };
    }

    /* -------------------------------------------- */

};
