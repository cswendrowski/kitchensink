       import VueRenderingMixin from '../VueRenderingMixin.mjs';
       import { NPCActorApp } from "../components/components.vue.es.mjs";
       import KitchenSinkRoll from "../../../rolls/roll.mjs";
       const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

       export default class NPCVueSheet extends VueRenderingMixin(foundry.applications.sheets.ActorSheetV2) {
           
           constructor(options = {}) {
               super(options);
               this.#dragDrop = this.#createDragDropHandlers();
           }
       
           vueParts = {
               "npc-actor-app": {
                   component: NPCActorApp,
                   template: "<npc-actor-app :context=\"context\">Vue rendering for sheet failed.</npc-actor-app>"
               }
           };

           _arrayEntryKey = 0;
           _renderKey = 0;

           /** @override */
           static DEFAULT_OPTIONS = {
               classes: ["kitchen-sink", "sheet", "vue-sheet", "actor", "npc-sheet"],
               viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
               editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
               position: {
                   width: 1200,
                   height: 950,
               },
               window: {
                   resizable: true,
                   title: "Npc",
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
               }
           }


           /* -------------------------------------------- */

           // User defined methods
       }
