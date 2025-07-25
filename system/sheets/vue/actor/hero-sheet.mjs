       import VueRenderingMixin from '../VueRenderingMixin.mjs';
       import { HeroActorApp } from "../components/components.vue.es.mjs";
       import KitchenSinkRoll from "../../../rolls/roll.mjs";
       const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

       export default class HeroVueSheet extends VueRenderingMixin(foundry.applications.sheets.ActorSheetV2) {
           
           constructor(options = {}) {
               super(options);
               this.#dragDrop = this.#createDragDropHandlers();
           }
       
           vueParts = {
               "hero-actor-app": {
                   component: HeroActorApp,
                   template: "<hero-actor-app :context=\"context\">Vue rendering for sheet failed.</hero-actor-app>"
               }
           };

           _arrayEntryKey = 0;
           _renderKey = 0;

           /** @override */
           static DEFAULT_OPTIONS = {
               classes: ["kitchen-sink", "sheet", "vue-sheet", "actor", "hero-sheet"],
               viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
               editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
               position: {
                   width: 1200,
                   height: 950,
               },
               window: {
                   resizable: true,
                   title: "Hero",
                   controls: [
                                           {
                                               action: "configurePrototypeToken",
                                               icon: "fa-solid fa-user-circle",
                                               label: "TOKEN.TitlePrototype",
                                               ownership: "OWNER"
                                           },
                                           {
                                               action: "showPortraitArtwork",
                                               icon: "fa-solid fa-image",
                                               label: "SIDEBAR.CharArt",
                                               ownership: "OWNER"
                                           },
                                           {
                                               action: "showTokenArtwork",
                                               icon: "fa-solid fa-image",
                                               label: "SIDEBAR.TokenArt",
                                               ownership: "OWNER"
                                           }
                                       ]
               },
               tag: "form",
               actions: {
                   onEditImage: this._onEditImage
               },
               changeActions: {
               },
               // Custom property that's merged into this.options
               dragDrop: [
                   {dragSelector: "tr", dropSelector: ".tabs-container"},
                   {dropSelector: ".single-document"},
                   {dragSelector: ".paper-doll-slot", dropSelector: ".paper-doll-slot"}
               ],
               form: {
                   submitOnChange: true,
                   submitOnClose: true,
                   closeOnSubmit: false,
               }
           };

           async _prepareContext(options) {
               // Output initialization
               const context = {
                   // Validates both permissions and compendium status
                   editable: this.isEditable,
                   owner: this.document.isOwner,
                   limited: this.document.limited,

                   // Add the document.
                   object: this.document.toObject(),
                   document: this.document,

                   // Add the data to context.data for easier access, as well as flags.
                   system: this.document.system,
                   flags: this.document.flags,

                   // Roll data.
                   rollData: this.document.getRollData() ?? {},

                   // Editors
                   editors: {},

                   // Force re-renders. Defined in the vue mixin.
                   _renderKey: this._renderKey ?? 0,
                   _arrayEntryKey: this._arrayEntryKey ?? 0,
                   // tabs: this._getTabs(options.parts),

                   // Necessary for formInput and formFields helpers
                   fields: this.document.schema.fields,
                   systemFields: this.document.system.schema.fields
               };

               // Enrich editors
               await this._enrichEditor(context, "description");
               await this._enrichEditor(context, "htmlfield");
               await this._enrichEditor(context, "background");

               // Make another pass through the editors to fix the element contents.
               for (let [field, editor] of Object.entries(context.editors)) {
                   if (context.editors[field].element) {
                       context.editors[field].element.innerHTML = context.editors[field].enriched;
                   }
               }

               return context;
           }

           async _enrichEditor(context, field) {
               const enrichmentOptions = {
                   // Whether to show secret blocks in the finished html
                   secrets: this.document.isOwner,
                   // Data to fill in for inline rolls
                   rollData: this.document.getRollData() ?? {},
                   // Relative UUID resolution
                   relativeTo: this.document
               };

               const editorOptions = {
                   toggled: true,
                   collaborate: true,
                   documentUUID: this.document.uuid,
                   height: 300
               };

               const editorValue = this.document.system?.[field] ?? foundry.utils.getProperty(this.document.system, field);
               context.editors[`system.${field}`] = {
                   enriched: await TextEditor.enrichHTML(editorValue, enrichmentOptions),
                   element: foundry.applications.elements.HTMLProseMirrorElement.create({
                       ...editorOptions,
                       name: `system.${field}`,
                       value: editorValue ?? ""
                   })
               };
           }

           /**
            * Actions performed after any render of the Application.
            * Post-render steps are not awaited by the render process.
            * @param {ApplicationRenderContext} context      Prepared context data
            * @param {RenderOptions} options                 Provided render options
            * @protected
            */
           _onRender(context, options) {
               this.#dragDrop.forEach((d) => d.bind(this.element));
               // You may want to add other special handling here
               // Foundry comes with a large number of utility classes, e.g. SearchFilter
               // That you may want to implement yourself.
           }

           /**
            * Handle changing a Document's image.
            *
            * @this ArchmageBaseItemSheetV2
            * @param {PointerEvent} event   The originating click event
            * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
            * @returns {Promise}
            * @protected
            */
           static async _onEditImage(event, target) {
               if (!this.isEditable) return false;
               const attr = target.dataset.edit;
               const current = foundry.utils.getProperty(this.document, attr);
               const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
               const fp = new FilePicker({
                   current,
                   type: "image",
                   redirectToRoot: img ? [img] : [],
                   callback: (path) => {
                       target.src = path;
                       this.document.update({ [attr]: path });
                       this._renderKey++;
                   },
                   top: this.position.top + 40,
                   left: this.position.left + 10
               });
               return fp.browse();
           }

           _prepareSubmitData(event, form, formData) {
               // We don't modify the image via the sheet itself, so we can remove it from the submit data to avoid errors.
               delete formData.object.img;
               return super._prepareSubmitData(event, form, formData);
           }

           // Drag and Drop

           /**
            * Returns an array of DragDrop instances
            * @type {DragDrop[]}
            */
           get dragDrop() {
               return this.#dragDrop;
           }

           /**
            * Define whether a user is able to begin a dragstart workflow for a given drag selector
            * @param {string} selector       The candidate HTML selector for dragging
            * @returns {boolean}             Can the current user drag this selector?
            * @protected
            */
           _canDragStart(selector) {
               return this.isEditable;
           }

           /**
            * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
            * @param {string} selector       The candidate HTML selector for the drop target
            * @returns {boolean}             Can the current user drop on this selector?
            * @protected
            */
           _canDragDrop(selector) {
               return this.isEditable;
           }

           /**
            * Callback actions which occur at the beginning of a drag start workflow.
            * @param {DragEvent} event       The originating DragEvent
            * @protected
            */
           _onDragStart(event) {
               console.log("Drag Start");

               if (event.currentTarget.classList.contains("paper-doll-slot")) {
                   // Remove the item from the slot
                   const name = event.currentTarget.dataset.name;
                   const update = {};
                   update[name] = null;
                   this.document.update(update);
               }
               else {
                   const tr = event.currentTarget.closest("tr");
                   const data = {
                       type: tr.dataset.type == "ActiveEffect" ? "ActiveEffect" : "Item",
                       uuid: tr.dataset.uuid
                   };

                   event.dataTransfer.setData("text/plain", JSON.stringify(data));
               }
           }

           /**
            * Callback actions which occur when a dragged element is over a drop target.
            * @param {DragEvent} event       The originating DragEvent
            * @protected
            */
           _onDragOver(event) {}

           /* -------------------------------------------- */

           async _onDrop(event) {
               const data = JSON.parse(event.dataTransfer.getData("text/plain"));

               // If the drop target is a single document, handle it differently
               const linkedClasses = [ "single-document", "paper-doll-slot" ];
               const eventClasses = Array.from(event.currentTarget.classList);
               if (eventClasses.find(c => linkedClasses.includes(c))) {
                   const doc = await fromUuid(data.uuid);
                   if ( !doc ) return;
                   if ( doc.type !== event.currentTarget.dataset.type ) {
                       ui.notifications.error(`Expected a ${event.currentTarget.dataset.type} type Document, but got a ${doc.type} type one instead. `);
                       return;
                   }

                   const update = {};
                   update[event.currentTarget.dataset.name] = data.uuid;
                   await this.document.update(update);
                   return;
               }

               const dropTypes = ["Item", "ActiveEffect"];
               if ( !dropTypes.includes(data.type) ) return;
               const item = await fromUuid(data.uuid);
               if ( !item ) return;

               if ( data.type === "ActiveEffect" ) {
                   ActiveEffect.createDocuments([item], {parent: this.document})
                   return;
               }

               Item.createDocuments([item], {parent: this.document})
           }

           /* -------------------------------------------- */

           /**
            * Returns an array of DragDrop instances
            * @type {DragDrop[]}
            */
           get dragDrop() {
               return this.#dragDrop;
           }

           // This is marked as private because there's no real need
           // for subclasses or external hooks to mess with it directly
           #dragDrop;

           /**
            * Create drag-and-drop workflow handlers for this Application
            * @returns {DragDrop[]}     An array of DragDrop handlers
            * @private
            */
           #createDragDropHandlers() {
               return this.options.dragDrop.map((d) => {
                   d.permissions = {
                       dragstart: this._canDragStart.bind(this),
                       drop: this._canDragDrop.bind(this)
                   };
                   d.callbacks = {
                       dragstart: this._onDragStart.bind(this),
                       dragover: this._onDragOver.bind(this),
                       drop: this._onDrop.bind(this)
                   };
                   return new DragDrop(d);
               });
           }

           /* -------------------------------------------- */

           async _onAction(event) {
               if (event.preventDefault) event.preventDefault();
               const action = event.currentTarget.dataset.action;
               switch ( action ) {
                   case "executemacro": this._onExecuteMacroAction(event, this.document.system); break;
                   case "flipacoin": this._onFlipACoinAction(event, this.document.system); break;
                   case "endcombat": this._onEndCombatAction(event, this.document.system); break;
                   case "nextturn": this._onNextTurnAction(event, this.document.system); break;
                   case "levelup": this._onLevelUpAction(event, this.document.system); break;
                   case "reset": this._onResetAction(event, this.document.system); break;
                   case "increment": this._onIncrementAction(event, this.document.system); break;
                   case "decrement": this._onDecrementAction(event, this.document.system); break;
                   case "increment2": this._onIncrement2Action(event, this.document.system); break;
                   case "decrement2": this._onDecrement2Action(event, this.document.system); break;
                   case "reset2": this._onReset2Action(event, this.document.system); break;
                   case "recover": this._onRecoverAction(event, this.document.system); break;
                   case "refill": this._onRefillAction(event, this.document.system); break;
                   case "heal": this._onHealAction(event, this.document.system); break;
                   case "roll": this._onRollAction(event, this.document.system); break;
                   case "healdamagetrack": this._onHealDamageTrackAction(event, this.document.system); break;
                   case "takebashing": this._onTakeBashingAction(event, this.document.system); break;
               }
           }

           
           /* -------------------------------------------- */

           async _onExecuteMacroAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               await context.object.system.macrofield?.execute();
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onFlipACoinAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
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
                   hasEffects: false,
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
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onEndCombatAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               if (!game.combat) {
                   return;
               }
               if (game.combat.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
                   
                   game.combat.endCombat();
               }
               else {
                   await new Promise((resolve, reject) => {
                       const firstGm = game.users.find(u => u.isGM && u.active);
                       if (!firstGm) {
                           ui.notifications.error("No active GM found to handle combat method request");
                           return;
                       }
                       const uuid = foundry.utils.randomID();

                       // Setup a listener that will wait for this response
                       game.socket.on("system.kitchen-sink", (data) => {
                           if (data.type != "combatResponse" || data.uuid != uuid) return;

                           resolve();
                       });

                       game.socket.emit("system.kitchen-sink", {
                           uuid: uuid,
                           type: "combat",
                           userId: game.user.id,
                           method: "end",
                       }, {recipients: [firstGm.id]});
                   });
               }
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onNextTurnAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               if (!game.combat) {
                   return;
               }
               if (game.combat.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
                   game.combat.nextTurn();
                   
               }
               else {
                   await new Promise((resolve, reject) => {
                       const firstGm = game.users.find(u => u.isGM && u.active);
                       if (!firstGm) {
                           ui.notifications.error("No active GM found to handle combat method request");
                           return;
                       }
                       const uuid = foundry.utils.randomID();

                       // Setup a listener that will wait for this response
                       game.socket.on("system.kitchen-sink", (data) => {
                           if (data.type != "combatResponse" || data.uuid != uuid) return;

                           resolve();
                       });

                       game.socket.emit("system.kitchen-sink", {
                           uuid: uuid,
                           type: "combat",
                           userId: game.user.id,
                           method: "nextTurn",
                       }, {recipients: [firstGm.id]});
                   });
               }
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onLevelUpAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               if ( context.object.system.experience.temp > 0 ) {
                   update["system.experience.temp"] = context.object.system.experience.temp - 10;

                   if ( update["system.experience.temp"] < 0 ) {
                       // Apply the remainder to the system property
                       update["system.experience.value"] = context.object.system.experience.value + update["system.experience.temp"];
                       update["system.experience.temp"] = 0;
                   }
               }
               else {
                   update["system.experience.value"] = context.object.system.experience.value - 10;
               }
               update["system.level"] = context.object.system.level + 1;
               if (selfDeleted) {
                   ui.notifications.error("Cannot update a deleted document");
               }
               else if (Object.keys(update).length > 0) {
                   await document.update(update);
                   context.object.system = document.system;
               }
               update = {};
               await new Promise(resolve => setTimeout(resolve, 30 * 1000)); // Wait for 30 seconds
               await this.function_Print(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, targetUpdate, targetEmbeddedUpdate, context.object.system.level)
               let amount = await this.function_FightFightFight(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, targetUpdate, targetEmbeddedUpdate, context.object.system.level);
               console.log("Leveled up to Level " + context.object.system.level + " with a Fight bonus of " + amount)
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onResetAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.count"] = 0;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onIncrementAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.count"] = context.object.system.count + 1;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onDecrementAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.count"] = context.object.system.count - 1;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onIncrement2Action(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.count2"] = context.object.system.count2 + context.object.system.fancycounteramount;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onDecrement2Action(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.count2"] = context.object.system.count2 - context.object.system.fancycounteramount;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onReset2Action(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.count2"] = 0;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onRecoverAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
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
                   hasEffects: false,
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
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onRefillAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               update["system.mana.value"] = context.object.system.mana?.max;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onHealAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               let amount = await new KitchenSinkRoll("(" + `@endure[Endure]` + ")" + "d6", {"endure": context.object.system.endure.mod ?? 0, }).roll();
               update["system.hp.value"] = context.object.system.hp.value + amount._total;
               // Create the chat message
               const HealedDescription = context.object.description ?? context.object.system.description;
               const HealedContext = { 
                   cssClass: "kitchen-sink Healed",
                   document: context.object,
                   description: HealedDescription,
                   hasDescription: HealedDescription!= "",
                   hasEffects: false,
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
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onRollAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               let levelToBonus = [1, 2, 4, 6, 8];
               let itemBonus = 0;
               for (const skill of context.object.system.skills ?? []) {
               itemBonus += skill.system.skillmod;
               }
               let levelBonusRoll = await new KitchenSinkRoll("d6" + "+" + `@leveltobonus[Level To Bonus]` + "+" + "@itembonus[Item Bonus]", {"leveltobonus": levelToBonus[1] ?? 0, "itembonus": itemBonus ?? 0}).roll();
               // Create the chat message
               const LevelBonusDescription = context.object.description ?? context.object.system.description;
               const LevelBonusContext = { 
                   cssClass: "kitchen-sink LevelBonus",
                   document: context.object,
                   description: LevelBonusDescription,
                   hasDescription: LevelBonusDescription!= "",
                   hasEffects: false,
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
               await game.system.utils.playSfx("sfx/sword.mp3", 1);
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onHealDamageTrackAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               if (context.object.system.damage?.bashing > 0 ) {
                   update["system.damage?.bashing"] = context.object.system.damage?.bashing - 1;
                   update["system.damage?.empty"] = context.object.system.damage?.empty + 1;
               }
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           async _onTakeBashingAction(event, system) {
               if (event.preventDefault) event.preventDefault();
               let update = {};
               let embeddedUpdate = {};
               let parentUpdate = {};
               let parentEmbeddedUpdate = {};
               let targetUpdate = {};
               let targetEmbeddedUpdate = {};
               let selfDeleted = false;
               let rerender = false;
               let document = this.document;
               const context = {
                   object: this.document,
                   target: game.user.getTargetOrNothing()
               };
               // If this is an item, attach the parent
               if (document.documentName === "Item" && document.parent) {
                   context.actor = document.parent;
               }
               else {
                   context.actor = document;
               }
               const amount = 5;
               if (context.object.system.damage?.bashing < amount ) {
                   update["system.damage?.bashing"] = context.object.system.damage?.bashing + 1;
                   update["system.damage?.empty"] = context.object.system.damage?.empty - 1;
               }
               const roll = await new Roll("1d10").roll();
               roll.toMessage({flavor: "Bashing Damage"});
               update["system.damage?.bashing"] = context.object.system.damage?.bashing + roll._total;
               if (!selfDeleted && Object.keys(update).length > 0) {
                   await this.document.update(update);
                   rerender = true;
               }
               if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                   for (let key of Object.keys(embeddedUpdate)) {
                       await this.document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                   }
                   rerender = true;
               }
               if (Object.keys(parentUpdate).length > 0) {
                   await this.document.parent.update(parentUpdate);
                   rerender = true;
               }
               if (Object.keys(parentEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(parentEmbeddedUpdate)) {
                       await document.parent.updateEmbeddedDocuments("Item", parentEmbeddedUpdate[key]);
                   }
               }
               if (Object.keys(targetUpdate).length > 0) {
                   await context.target.update(targetUpdate);
               }
               if (Object.keys(targetEmbeddedUpdate).length > 0) {
                   for (let key of Object.keys(targetEmbeddedUpdate)) {
                       await context.target.updateEmbeddedDocuments("Item", targetEmbeddedUpdate[key]);
                   }
               }
               if (rerender) {
                   this.render();
               }
           }

           /* -------------------------------------------- */

           // User defined methods
           async function_Print(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, targetUpdate, targetEmbeddedUpdate, value) {
               let system = context.object.system;
               console.log("Leveled up to Level " + value)
           }

           async function_FightFightFight(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, targetUpdate, targetEmbeddedUpdate, mod) {
               let system = context.object.system;
               let rollResult = await new KitchenSinkRoll("d6" + "+" + `@fight[Fight]` + "+" + "@mod[Mod]", {"fight": context.object.system.fight.mod ?? 0, "mod": mod ?? 0}).roll();
               return rollResult.total;
           }

           async function_VisibleUnlessDisabled(context, update, embeddedUpdate, parentUpdate, parentEmbeddedUpdate, targetUpdate, targetEmbeddedUpdate, disabled) {
               let system = context.object.system;
               if (disabled ) {
                   return "hidden";
               }
               return "default";
           }

       }
