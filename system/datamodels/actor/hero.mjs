import KitchenSinkActor from "../../documents/actor.mjs";
import KitchenSinkItem from "../../documents/item.mjs";
import UuidDocumentField from "../UuidDocumentField.mjs";

export default class HeroTypeDataModel extends foundry.abstract.DataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: false, blank: true, initial: ""}),
            stringfield: new fields.StringField({initial: ""}),
            numberfield: new fields.NumberField({integer: true}),
            booleanfield: new fields.BooleanField(),
            htmlfield: new fields.HTMLField({required: false, blank: true, initial: ""}),
            resourcefield: new fields.SchemaField({
                value: new fields.NumberField({min: -100, initial: 0, integer: true}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({min: 0, initial: 100, integer: true}),
            }),
            trackerfield: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: -10}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            attributefield: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 0, initial: 0}),
                max: new fields.NumberField({integer: true, min: 0, initial: 100}),
            }),
            measuredtemplatefield: new fields.SchemaField({
                type: new fields.StringField({initial: "circle"}),
                distance: new fields.NumberField({integer: true, initial: 5}),
                direction: new fields.NumberField({integer: true, initial: 0}),
                angle: new fields.NumberField({integer: true, initial: 0}),
                width: new fields.NumberField({integer: true, initial: 0}),
            }),
            datefield: new fields.StringField({initial: new Intl.DateTimeFormat('en-CA').format(new Date()) }),
            timefield: new fields.StringField({initial: new Date().toTimeString().slice(0, 5) }),
            datetimefield: new fields.StringField({initial: new Date().toISOString().slice(0, 16) }),
            diefield: new fields.StringField({initial: "d20"}),
            singledocumentfield: new UuidDocumentField(),
            choicefield: new UuidDocumentField(),
            macrofield: new UuidDocumentField(),
            paperdollfield: new fields.SchemaField({
                a: new UuidDocumentField(),
                b: new UuidDocumentField()
            }),
            herotype: new fields.SchemaField({
                value: new fields.StringField({
                    choices: ["A", "B", "C"],
                    initial: "A"
                }),
                icon: new fields.StringField({initial: ""}),
                color: new fields.StringField({initial: "#ffffff"})
            }),
            damagetype: new fields.SchemaField({
                value: new fields.StringField({
                    choices: ["Cutting", "Piercing", "Bludgeoning"],
                    initial: "Cutting"
                }),
                icon: new fields.StringField({initial: ""}),
                color: new fields.StringField({initial: "#ffffff"})
            }),
            summary: new fields.StringField({initial: ""}),
            text2: new fields.StringField({initial: ""}),
            background: new fields.HTMLField({required: false, blank: true, initial: ""}),
            backgroundtext: new fields.StringField({initial: ""}),
            fate: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: 0}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            shield: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: 0}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            wounds: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: -10}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            heat: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: -10}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            time: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: -10}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            timepassed: new fields.NumberField({integer: true, min: 0, max: 100}),
            outoftime: new fields.BooleanField(),
            level: new fields.NumberField({integer: true, min: 1, max: 10}),
            plain: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: -10}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 10}),
            }),
            experiencetrack: new fields.NumberField({integer: true, max: 10}),
            experience: new fields.SchemaField({
                min: new fields.NumberField({integer: true, initial: 0}),
                value: new fields.NumberField({integer: true, initial: 0}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({integer: true, min: 0, initial: 100}),
            }),
            fight: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 1, initial: 1}),
                max: new fields.NumberField({integer: true, min: 0, initial: 30}),
            }),
            flight: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 1, initial: 1}),
                max: new fields.NumberField({integer: true, min: 0, initial: 30}),
            }),
            endure: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 1, initial: 1}),
                max: new fields.NumberField({integer: true, min: 0, initial: 30}),
            }),
            persuade: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 1, initial: 1}),
                max: new fields.NumberField({integer: true, min: 0, initial: 30}),
            }),
            grit: new fields.SchemaField({
                value: new fields.NumberField({integer: true, min: 1, initial: 1}),
                max: new fields.NumberField({integer: true, min: 0, initial: 6}),
            }),
            slowed: new fields.BooleanField(),
            dazed: new fields.BooleanField(),
            count: new fields.NumberField({integer: true}),
            count2: new fields.NumberField({integer: true}),
            fancycounteramount: new fields.NumberField({integer: true}),
            something: new fields.NumberField({integer: true}),
            anotherthing: new fields.NumberField({integer: true}),
            hp: new fields.SchemaField({
                value: new fields.NumberField({min: -100, initial: 0, integer: true}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({min: 0, initial: 100, integer: true}),
            }),
            defense: new fields.NumberField({integer: true}),
            stealth: new fields.NumberField({integer: true}),
            stagger: new fields.SchemaField({
                value: new fields.NumberField({min: -100, initial: 0, integer: true}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({min: 0, initial: 100, integer: true}),
            }),
            mana: new fields.SchemaField({
                value: new fields.NumberField({min: -100, initial: 0, integer: true}),
                temp: new fields.NumberField({initial: 0, min: 0, integer: true}),
                max: new fields.NumberField({min: 0, initial: 10, integer: true}),
            }),
            damagetrack: new fields.NumberField({integer: true, max: 5}),
            crisis: new fields.NumberField({integer: true}),
            level2: new fields.NumberField({integer: true}),
            availableskilllevels: new fields.NumberField({integer: true}),
            armor: new UuidDocumentField(),
        };
    }

    /* -------------------------------------------- */

    get dead() {
        return this.hp.value <= 0 ;
    }

    get staggered() {
        return this.parent.statuses.has("staggered");
    }
};
