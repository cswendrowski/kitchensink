import KitchenSinkActor from "../../documents/actor.mjs";
import KitchenSinkItem from "../../documents/item.mjs";
import UuidDocumentField from "../UuidDocumentField.mjs";

export default class SkillTypeDataModel extends foundry.abstract.DataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: false, blank: true, initial: ""}),
            ability: new fields.StringField({initial: ""}),
            trained: new fields.BooleanField(),
            skillmod: new fields.NumberField({integer: true}),
            usesleft: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: -10}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            die: new fields.StringField({initial: "d20"}),
            template: new fields.SchemaField({
                type: new fields.StringField({initial: "circle"}),
                distance: new fields.NumberField({integer: true, initial: 5}),
                direction: new fields.NumberField({integer: true, initial: 0}),
                angle: new fields.NumberField({integer: true, initial: 0}),
                width: new fields.NumberField({integer: true, initial: 0}),
            }),
            skill: new fields.NumberField({integer: true}),
            rollanswer: new foundry.data.fields.SchemaField({
                bonus: new fields.NumberField({integer: true}),
                hasadvantage: new fields.BooleanField(),
            }),
        };
    }

    /* -------------------------------------------- */

};
