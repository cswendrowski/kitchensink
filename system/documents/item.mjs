  export default class KitchenSinkItem extends Item {
      /** @override */
      prepareDerivedData() {
          switch ( this.type ) {
              case "skill": return this._prepareSkillDerivedData();
              case "equipment": return this._prepareEquipmentDerivedData();
              case "spell": return this._prepareSpellDerivedData();
              case "potion": return this._preparePotionDerivedData();
          }
      }

      /* -------------------------------------------- */

      async _prepareSkillDerivedData() {
          const editMode = this.flags["kitchen-sink"]?.["edit-mode"] ?? true;

          // SkillMod Number Derived Data
          const skillmodCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.skillmod ?? 0
          };
          this.system.skillmod = skillmodCurrentValueFunc(this.system);



           // Template Measured Template Field Derived Data

           const templateSummary = () => {
               let sum = `${this.system.template.direction}° ${this.system.template.type} (${this.system.template.distance} squares)`;
               if (this.system.template.type === 'cone') sum += ` ${this.system.template.angle}° angle`;
               if (this.system.template.type === 'ray') sum += ` ${this.system.template.width} squares wide`;
               return sum;
           }
           this.system.template.summary = templateSummary();
                          // Skill Number Calculated Data


                          

                          

                          // Skill Number Derived Data
                          const skillCurrentValueFunc = (system) => {
                              const context = {
                                      object: this
                              };
                              if (system.trained > 0 ) {
                                  return 2 + system.skillmod;
                              }
                              return 0 + system.skillmod;
                          };
                          Object.defineProperty(this.system, "skill", {
                              get: () => {
                                  let current = skillCurrentValueFunc(this.system);
                                  
                                  
                                  return current;
                              },
                              configurable: true
                          });


          
      }

      async _prepareEquipmentDerivedData() {
          const editMode = this.flags["kitchen-sink"]?.["edit-mode"] ?? true;

          // Bonus Number Derived Data
          const bonusCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.bonus ?? 0
          };
          this.system.bonus = bonusCurrentValueFunc(this.system);




          
      }

      async _prepareSpellDerivedData() {
          const editMode = this.flags["kitchen-sink"]?.["edit-mode"] ?? true;

          // Level Number Derived Data
          const levelCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.level ?? 0
          };
          this.system.level = levelCurrentValueFunc(this.system);



          // Cost Number Derived Data
          const costCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.cost ?? 0
          };
          this.system.cost = costCurrentValueFunc(this.system);




          
      }

      async _preparePotionDerivedData() {
          const editMode = this.flags["kitchen-sink"]?.["edit-mode"] ?? true;

          // Quantity Number Derived Data
          const quantityCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.quantity ?? 0
          };
          this.system.quantity = quantityCurrentValueFunc(this.system);




          
      }

  
      /* -------------------------------------------- */


      /* -------------------------------------------- */

      reapplyActiveEffectsForName(name) {
          for (const effect of this.appliedEffects) {
              for (const change of effect.changes) {
                  if (change.key == name) {
                      const changes = effect.apply(this, change);
                      Object.assign(this.overrides, changes);
                  }
              }
          }
      }

      /* -------------------------------------------- */

      /** @override */
      _initialize(options = {}) {
          super._initialize(options);
          
          switch ( this.type ) {
              case "skill": return this._registerSkillHooks(this);
              case "equipment": return this._registerEquipmentHooks(this);
              case "spell": return this._registerSpellHooks(this);
              case "potion": return this._registerPotionHooks(this);
          }
      }

      /* -------------------------------------------- */

      _registerSkillHooks(document) {
      }

      _registerEquipmentHooks(document) {
      }

      _registerSpellHooks(document) {
      }

      _registerPotionHooks(document) {
      }


      /* -------------------------------------------- */

      // In order to support per-document type effects, we need to override the allApplicableEffects method to yield virtualized effects with only changes that match the document type
      /** @override */
      *allApplicableEffects() {
          const systemFlags = this.flags["kitchen-sink"] ?? {};
          const edit = systemFlags["edit-mode"] ?? true;

          function getTypedEffect(type, edit, effect, source) {
              const typedEffect = new ActiveEffect(foundry.utils.duplicate(effect), {parent: effect.parent});
              typedEffect.changes = typedEffect.changes.filter(c => c.key.startsWith(type));
              for ( const change of typedEffect.changes ) {
                  if (change.mode == 0) continue;
                  change.key = change.key.replace(type + ".", "");
              }
              if ( edit ) typedEffect.disabled = true;
              typedEffect.source = source;
              return typedEffect;
          }

          for ( const effect of this.effects ) {
              yield getTypedEffect(this.type, edit, effect, game.i18n.localize("Self"));
          }
          
      }


      /* -------------------------------------------- */

      _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
          super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);

          for (const document of documents) {
              if (document.documentName !== "ActiveEffect") continue;
              
              for (const change of document.changes) {
                  if (change.mode != 0) continue;
                  const customMode = foundry.utils.getProperty(document.flags["kitchen-sink"], change.key + "-custommode");
                  switch (customMode) {
                      case 1: // Add Once
                          this._effectAddOnce(parent, document, change);
                          break;
                      default:
                          console.error("Unknown custom mode", customMode);
                          break;
                  }
              }
          }
      }

      /* -------------------------------------------- */

      _effectAddOnce(parent, ae, change) {
          console.dir("AddOnce", parent, ae, change);

          const key = change.key.replace(parent.type + ".", "");
          const currentValue = foundry.utils.getProperty(parent, key);

          // Create an update for the parent
          const update = {
              [key]: currentValue + parseInt(change.value)
          };
          parent.update(update);

          // Create a chat card
          const chatData = {
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: parent }),
              content: `<p>Added "${ae.name}" once</p>`
          };
          ChatMessage.create(chatData);
      }

      /* -------------------------------------------- */
      
      static async createDialog(data = {}, { parent = null, pack = null, types = null, ...options } = {}) {
          types ??= game.documentTypes[this.documentName].filter(t => (t !== CONST.BASE_DOCUMENT_TYPE) && (CONFIG[this.documentName].typeCreatables[t] !== false));
          if (!types.length) return null;

          const collection = parent ? null : pack ? game.packs.get(pack) : game.collections.get(this.documentName);
          const folders = collection?._formatFolderSelectOptions() ?? [];

          const label = game.i18n.localize(this.metadata.label);
          const title = game.i18n.format("DOCUMENT.Create", { type: label });
          const name = data.name || game.i18n.format("DOCUMENT.New", { type: label });

          let type = data.type || CONFIG[this.documentName]?.defaultType;
          if (!types.includes(type)) type = types[0];

          // If there's only one type, no need to prompt
          if (types.length === 1) {
              let createName = this.defaultName();
              const createData = {
                  name: createName,
                  type
              };
              return this.create(createData, { parent, pack, renderSheet: true });
          }
          
          const createResponse = await game.system.documentCreateDialog.prompt({
              type,
              types: types.reduce((arr, typer) => {
                  arr.push({
                      type: typer,
                      label: game.i18n.has(typer) ? game.i18n.localize(typer) : typer,
                      icon: this.getDefaultArtwork({ type: typer })?.img ?? "icons/svg/item-bag.svg",
                      description: CONFIG[this.documentName]?.typeDescriptions?.[typer] ?? "",
                      selected: type === typer
                  });
                  return arr;
              }, []).sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang)),
              name,
              title,
              label,
              folders,
              folder: data.folder
          });
          
          const createData = foundry.utils.mergeObject(data, createResponse, { inplace: false });
          createData.type = createData.type || type;
          createData.type = createData.type.toLowerCase();
          if (!createData.folder) delete createData.folder;
          if (!createData.name?.trim()) createData.name = this.defaultName();
          return this.create(createData, { parent, pack, renderSheet: true });

          const content = await renderTemplate("systems/kitchen-sink/system/templates/document-create.hbs", {
              folders, name, type,
              folder: data.folder,
              hasFolders: folders.length > 0,
              types: types.reduce((arr, typer) => {
                  arr.push({
                      type: typer,
                      label: game.i18n.has(typer) ? game.i18n.localize(typer) : typer,
                      icon: this.getDefaultArtwork({ type: typer })?.img ?? "icons/svg/item-bag.svg",
                      description: CONFIG[this.documentName]?.typeDescriptions?.[typer] ?? "",
                      selected: type === typer
                  });
                  return arr;
              }, []).sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang))
          });
          return Dialog.prompt({
              title, content,
              label: title,
              render: html => {
                  const app = html.closest(".app");
                  const folder = app.querySelector("select");
                  if (folder) app.querySelector(".dialog-buttons").insertAdjacentElement("afterbegin", folder);
                  app.querySelectorAll(".window-header .header-button").forEach(btn => {
                      const label = btn.innerText;
                      const icon = btn.querySelector("i");
                      btn.innerHTML = icon.outerHTML;
                      btn.dataset.tooltip = label;
                      btn.setAttribute("aria-label", label);
                  });
                  app.querySelector(".document-name").select();
              },
              callback: html => {
                  const form = html.querySelector("form");
                  const fd = new FormDataExtended(form);
                  const createData = foundry.utils.mergeObject(data, fd.object, { inplace: false });

              },
              rejectClose: false,
              options: { ...options, jQuery: false, width: 700, height: 'auto', classes: ["kitchen-sink", "create-document", "dialog"] }
          });
      }

      /* -------------------------------------------- */

      static getDefaultArtwork(itemData = {}) {
          const { type } = itemData;
          const { img } = super.getDefaultArtwork(itemData);
          return { img: CONFIG[this.documentName]?.typeArtworks?.[type] ?? img };
      }

      /* -------------------------------------------- */

      getRollData() {
          const data = super.getRollData();
          const rollData = foundry.utils.duplicate(data);
          rollData.system = this.system;
          return rollData;
      }

      /* -------------------------------------------- */

      /** @override */
      async modifyTokenAttribute(attribute, value, isDelta, isBar) {
          const resource = foundry.utils.getProperty(this.system, attribute);

          if (isDelta && value < 0) {
              // Apply to temp first
              resource.temp += value;

              // If temp is negative, apply to value
              if (resource.temp < 0) {
                  resource.value += resource.temp;
                  resource.temp = 0;
              }
              await this.update({ ["system." + attribute]: resource });
              return;
          }

          return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
      }

      
  }
