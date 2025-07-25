export default class KitchenSinkRoll extends Roll {
    async getTooltip() {
        const parts = [];

        for ( const term of this.terms ) {
            if ( foundry.utils.isSubclass(term.constructor, foundry.dice.terms.DiceTerm) ) {
                parts.push(term.getTooltipData());
            }
            else if ( foundry.utils.isSubclass(term.constructor, foundry.dice.terms.NumericTerm) ) {
                parts.push({
                    formula: term.flavor,
                    total: term.total,
                    faces: null,
                    flavor: "",
                    rolls: []
                });
            }
        }

        return renderTemplate(this.constructor.TOOLTIP_TEMPLATE, { parts });
    }

    /* -------------------------------------------- */

    get cleanFormula() {
        // Replace flavor terms such as 5[STR] with just the flavor text
        let cleanFormula = this._formula;
        for ( const term of this.terms ) {
            if ( term instanceof foundry.dice.terms.NumericTerm ) {
                cleanFormula = cleanFormula.replace(term.formula, term.flavor);
            }
        }

        // If there are still parts of the formula such as 5[STR] then replace them with just the flavor text
        const rgx = new RegExp(/(\d+)\[(.*?)\]/g);
        cleanFormula = cleanFormula.replace(rgx, "$2");

        return cleanFormula;
    }
}
