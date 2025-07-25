import KitchenSinkActor from "../../documents/actor.mjs";
import KitchenSinkItem from "../../documents/item.mjs";
import UuidDocumentField from "../UuidDocumentField.mjs";

export default class EquipmentTypeDataModel extends foundry.abstract.DataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: false, blank: true, initial: ""}),
            type: new fields.StringField({
                choices: ["Armor", "Weapon"],
                initial: "Armor"
            }),
            bonus: new fields.NumberField({integer: true}),
            parentattribute: new fields.StringField({initial: ""}),
            parentresource: new fields.StringField({initial: ""}),
            parentnumber: new fields.StringField({initial: ""}),
            parentboolean: new fields.StringField({initial: ""}),
            parentdate: new fields.StringField({initial: ""}),
            parenttime: new fields.StringField({initial: ""}),
            parentdatetime: new fields.StringField({initial: ""}),
            parentdie: new fields.StringField({initial: ""}),
            parentstring: new fields.StringField({initial: ""}),
            parenttracker: new fields.StringField({initial: ""}),
            parentchoice: new fields.StringField({initial: ""}),
            parentpaperdoll: new fields.StringField({initial: ""}),
            parenthtml: new fields.StringField({initial: ""}),
        };
    }

    /* -------------------------------------------- */

};
