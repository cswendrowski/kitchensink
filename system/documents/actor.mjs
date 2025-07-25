  export default class KitchenSinkActor extends Actor {
      /** @override */
      prepareDerivedData() {
          switch ( this.type ) {
              case "hero": return this._prepareHeroDerivedData();
              case "npc": return this._prepareNPCDerivedData();
          }
      }

      /* -------------------------------------------- */

      async _prepareHeroDerivedData() {
          const editMode = this.flags["kitchen-sink"]?.["edit-mode"] ?? true;

          // NumberField Number Derived Data
          const numberfieldCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.numberfield ?? 0
          };
          this.system.numberfield = numberfieldCurrentValueFunc(this.system);




          // AttributeField Attribute Derived Data
          const attributefieldCurrentValue = this.system.attributefield?.value ?? 0;
          const attributefieldCurrentMax = this.system.attributefield?.max ?? 0;
          const attributefieldModFunc = (system) => {
              const context = {
                  object: this
              };
              return attributefieldCurrentValue
          };
          this.system.attributefield = {
              value: attributefieldCurrentValue,
              max: attributefieldCurrentMax,
              mod: attributefieldModFunc(this.system)
          };
          if ( this.system.attributefield.value > this.system.attributefield.max ) {
              this.system.attributefield.value = this.system.attributefield.max;
          }
           // MeasuredTemplateField Measured Template Field Derived Data

           const measuredtemplatefieldSummary = () => {
               let sum = `${this.system.measuredtemplatefield.direction}° ${this.system.measuredtemplatefield.type} (${this.system.measuredtemplatefield.distance} squares)`;
               if (this.system.measuredtemplatefield.type === 'cone') sum += ` ${this.system.measuredtemplatefield.angle}° angle`;
               if (this.system.measuredtemplatefield.type === 'ray') sum += ` ${this.system.measuredtemplatefield.width} squares wide`;
               return sum;
           }
           this.system.measuredtemplatefield.summary = measuredtemplatefieldSummary();
          // SkillsTable Document Array Derived Data
          this.system.skillstable = this.items.filter((item) => item.type == "skill");
          // Text2 String Derived Data
          this.system.text2 = "This is a locked text field that cannot be edited by the player.";
          // Fate Tracker Derived Data
          const fateTempValue = this.system.fate.temp ?? 0;
          const fateCurrentMin = (system) => {
              return 0;;
          }
          const fateCurrentValue = (system) => {
              return this.system.fate?.value ?? 0;;
          }
          const fateCurrentMax = (system) => {
              return this.system.fate?.max ?? 0;;
          }
          this.system.fate = {
              min: fateCurrentMin(this.system),
              value: fateCurrentValue(this.system),
              temp: fateTempValue,
              max: fateCurrentMax(this.system),
          };
          if ( !editMode && this.system.fate.value < this.system.fate.min ) {
              this.system.fate.value = this.system.fate.min;
          }
          else if ( !editMode && this.system.fate.value > this.system.fate.max ) {
              this.system.fate.value = this.system.fate.max;
          }
          // Shield Tracker Derived Data
          const shieldTempValue = this.system.shield.temp ?? 0;
          const shieldCurrentMin = (system) => {
              return 0;;
          }
          const shieldCurrentValue = (system) => {
              return this.system.shield?.value ?? 0;;
          }
          const shieldCurrentMax = (system) => {
              return this.system.shield?.max ?? 0;;
          }
          this.system.shield = {
              min: shieldCurrentMin(this.system),
              value: shieldCurrentValue(this.system),
              temp: shieldTempValue,
              max: shieldCurrentMax(this.system),
          };
          if ( !editMode && this.system.shield.value < this.system.shield.min ) {
              this.system.shield.value = this.system.shield.min;
          }
          else if ( !editMode && this.system.shield.value > this.system.shield.max ) {
              this.system.shield.value = this.system.shield.max;
          }
          // TimePassed Number Derived Data
          const timepassedCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.timepassed ?? 0
          };
          this.system.timepassed = timepassedCurrentValueFunc(this.system);

          const timepassedMinFunc = (system) => {
              const context = {
                  object: this
              };
              return 0
          };
          const timepassedMin = timepassedMinFunc(this.system);
          if ( this.system.timepassed < timepassedMin ) {
              this.system.timepassed = timepassedMin;
          }


          const timepassedMaxFunc = (system) => {
              const context = {
                  object: this
              };
              return 100
          };
          const timepassedMax = timepassedMaxFunc(this.system);
          if ( this.system.timepassed > timepassedMax ) {
              this.system.timepassed = timepassedMax;
          }

          // Level Number Derived Data
          const levelCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.level ?? 0
          };
          this.system.level = levelCurrentValueFunc(this.system);

          const levelMinFunc = (system) => {
              const context = {
                  object: this
              };
              return 1
          };
          const levelMin = levelMinFunc(this.system);
          if ( this.system.level < levelMin ) {
              this.system.level = levelMin;
          }


          const levelMaxFunc = (system) => {
              const context = {
                  object: this
              };
              return 10
          };
          const levelMax = levelMaxFunc(this.system);
          if ( this.system.level > levelMax ) {
              this.system.level = levelMax;
          }

          // Plain Tracker Derived Data
          const plainTempValue = this.system.plain.temp ?? 0;
          const plainCurrentMin = (system) => {
              return this.system.plain?.min ?? 0;;
          }
          const plainCurrentValue = (system) => {
              const context = {
                  object: this
              };
              return system.level;
              ;
          }
          const plainCurrentMax = (system) => {
              return this.system.plain?.max ?? 0;;
          }
          this.system.plain = {
              min: plainCurrentMin(this.system),
              value: plainCurrentValue(this.system),
              temp: plainTempValue,
              max: plainCurrentMax(this.system),
          };
          if ( !editMode && this.system.plain.value < this.system.plain.min ) {
              this.system.plain.value = this.system.plain.min;
          }
          else if ( !editMode && this.system.plain.value > this.system.plain.max ) {
              this.system.plain.value = this.system.plain.max;
          }
          // ExperienceTrack Pips Derived Data
          const experiencetrackCurrentValueFunc = (system) => {
              return system.experience.value;
          };
          this.system.experiencetrack = experiencetrackCurrentValueFunc(this.system);




          const experiencetrackMaxFunc = (system) => {
              return 10
          };
          const experiencetrackMax = experiencetrackMaxFunc(this.system);
          if ( this.system.experiencetrack > experiencetrackMax ) {
              this.system.experiencetrack = experiencetrackMax;
          }

          // Experience Tracker Derived Data
          const experienceTempValue = this.system.experience.temp ?? 0;
          const experienceCurrentMin = (system) => {
              return 0;;
          }
          const experienceCurrentValue = (system) => {
              return this.system.experience?.value ?? 0;;
          }
          const experienceCurrentMax = (system) => {
              return 100;;
          }
          this.system.experience = {
              min: experienceCurrentMin(this.system),
              value: experienceCurrentValue(this.system),
              temp: experienceTempValue,
              max: experienceCurrentMax(this.system),
          };
          if ( !editMode && this.system.experience.value < this.system.experience.min ) {
              this.system.experience.value = this.system.experience.min;
          }
          else if ( !editMode && this.system.experience.value > this.system.experience.max ) {
              this.system.experience.value = this.system.experience.max;
          }

          // Fight Attribute Derived Data
          const fightCurrentValue = this.system.fight?.value ?? 0;
          const fightCurrentMax = this.system.fight?.max ?? 0;
          const fightModFunc = (system) => {
              const context = {
                  object: this
              };
              return (system.fight.value - 10) / 2;
          };
          this.system.fight = {
              value: fightCurrentValue,
              max: fightCurrentMax,
              mod: fightModFunc(this.system)
          };
          if ( this.system.fight.value > this.system.fight.max ) {
              this.system.fight.value = this.system.fight.max;
          }

          // Flight Attribute Derived Data
          const flightCurrentValue = this.system.flight?.value ?? 0;
          const flightCurrentMax = this.system.flight?.max ?? 0;
          const flightModFunc = (system) => {
              const context = {
                  object: this
              };
              return (system.flight.value - 10) / 2;
          };
          this.system.flight = {
              value: flightCurrentValue,
              max: flightCurrentMax,
              mod: flightModFunc(this.system)
          };
          if ( this.system.flight.value > this.system.flight.max ) {
              this.system.flight.value = this.system.flight.max;
          }

          // Endure Attribute Derived Data
          const endureCurrentValue = this.system.endure?.value ?? 0;
          const endureCurrentMax = this.system.endure?.max ?? 0;
          const endureModFunc = (system) => {
              const context = {
                  object: this
              };
              return (system.endure.value - 10) / 2;
          };
          this.system.endure = {
              value: endureCurrentValue,
              max: endureCurrentMax,
              mod: endureModFunc(this.system)
          };
          if ( this.system.endure.value > this.system.endure.max ) {
              this.system.endure.value = this.system.endure.max;
          }

          // Persuade Attribute Derived Data
          const persuadeCurrentValue = this.system.persuade?.value ?? 0;
          const persuadeCurrentMax = this.system.persuade?.max ?? 0;
          const persuadeModFunc = (system) => {
              const context = {
                  object: this
              };
              return (system.persuade.value - 10) / 2;
          };
          this.system.persuade = {
              value: persuadeCurrentValue,
              max: persuadeCurrentMax,
              mod: persuadeModFunc(this.system)
          };
          if ( this.system.persuade.value > this.system.persuade.max ) {
              this.system.persuade.value = this.system.persuade.max;
          }

          // Grit Attribute Derived Data
          const gritCurrentValue = this.system.grit?.value ?? 0;
          const gritCurrentMax = this.system.grit?.max ?? 0;
          const gritModFunc = (system) => {
              const context = {
                  object: this
              };
              return gritCurrentValue
          };
          this.system.grit = {
              value: gritCurrentValue,
              max: gritCurrentMax,
              mod: gritModFunc(this.system)
          };
          if ( this.system.grit.value > this.system.grit.max ) {
              this.system.grit.value = this.system.grit.max;
          }
          // Count Number Derived Data
          const countCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.count ?? 0
          };
          this.system.count = countCurrentValueFunc(this.system);



          // Count2 Number Derived Data
          const count2CurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.count2 ?? 0
          };
          this.system.count2 = count2CurrentValueFunc(this.system);



          // FancyCounterAmount Number Derived Data
          const fancycounteramountCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.fancycounteramount ?? 0
          };
          this.system.fancycounteramount = fancycounteramountCurrentValueFunc(this.system);



          // SomeThing Number Derived Data
          const somethingCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.something ?? 0
          };
          this.system.something = somethingCurrentValueFunc(this.system);



          // AnotherThing Number Derived Data
          const anotherthingCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.anotherthing ?? 0
          };
          this.system.anotherthing = anotherthingCurrentValueFunc(this.system);



          // HP Resource Derived Data
          const hpTempValue = this.system.hp.temp ?? 0;
          const hpCurrentMin = (system) => {
              return this.system.hp?.min ?? 0;;
          }
          const hpCurrentValue = (system) => {
              return this.system.hp?.value ?? 0;;
          }
          const hpCurrentMax = (system) => {
              const context = {
                  object: this
              };
              return system.endure.mod + 6;
              ;
          }
          this.system.hp = {
              value: hpCurrentValue(this.system),
              temp: hpTempValue,
              max: hpCurrentMax(this.system)
          };
          this.reapplyActiveEffectsForName("system.hp.max");
          if ( !editMode && this.system.hp.value < hpCurrentMin(this.system) ) {
              this.system.hp.value = hpCurrentMin(this.system);
          }
          else if ( !editMode && this.system.hp.value > this.system.hp.max ) {
              this.system.hp.value = this.system.hp.max;
          }
                          // Defense Number Calculated Data


                          

                          

                          // Defense Number Derived Data
                          const defenseCurrentValueFunc = (system) => {
                              const context = {
                                      object: this
                              };
                              if (system.fight.mod + system.endure.mod === 0 ) {
                                  return 4;
                              }
                              return system.fight.mod + system.endure.mod / 2 + 4;
                          };
                          Object.defineProperty(this.system, "defense", {
                              get: () => {
                                  let current = defenseCurrentValueFunc(this.system);
                                  
                                  
                                  return current;
                              },
                              configurable: true
                          });

          // Stealth Number Derived Data
          const stealthCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.stealth ?? 0
          };
          this.system.stealth = stealthCurrentValueFunc(this.system);



          const stealthMaxFunc = (system) => {
              const context = {
                  object: this
              };
              return system.flight.mod;
          };
          const stealthMax = stealthMaxFunc(this.system);
          if ( this.system.stealth > stealthMax ) {
              this.system.stealth = stealthMax;
          }

          // Stagger Resource Derived Data
          const staggerTempValue = this.system.stagger.temp ?? 0;
          const staggerCurrentMin = (system) => {
              return this.system.stagger?.min ?? 0;;
          }
          const staggerCurrentValue = (system) => {
              return this.system.stagger?.value ?? 0;;
          }
          const staggerCurrentMax = (system) => {
              const context = {
                  object: this
              };
              return system.endure.mod + system.fight.mod;
              ;
          }
          this.system.stagger = {
              value: staggerCurrentValue(this.system),
              temp: staggerTempValue,
              max: staggerCurrentMax(this.system)
          };
          this.reapplyActiveEffectsForName("system.stagger.max");
          if ( !editMode && this.system.stagger.value < staggerCurrentMin(this.system) ) {
              this.system.stagger.value = staggerCurrentMin(this.system);
          }
          else if ( !editMode && this.system.stagger.value > this.system.stagger.max ) {
              this.system.stagger.value = this.system.stagger.max;
          }
          // Mana Resource Derived Data
          const manaTempValue = this.system.mana.temp ?? 0;
          const manaCurrentMin = (system) => {
              return this.system.mana?.min ?? 0;;
          }
          const manaCurrentValue = (system) => {
              return this.system.mana?.value ?? 0;;
          }
          const manaCurrentMax = (system) => {
              return 10;;
          }
          this.system.mana = {
              value: manaCurrentValue(this.system),
              temp: manaTempValue,
              max: manaCurrentMax(this.system)
          };
          this.reapplyActiveEffectsForName("system.mana.max");
          if ( !editMode && this.system.mana.value < manaCurrentMin(this.system) ) {
              this.system.mana.value = manaCurrentMin(this.system);
          }
          else if ( !editMode && this.system.mana.value > this.system.mana.max ) {
              this.system.mana.value = this.system.mana.max;
          }
          // DamageTrack Pips Derived Data
          const damagetrackCurrentValueFunc = (system) => {
              return system.endure.mod;
          };
          this.system.damagetrack = damagetrackCurrentValueFunc(this.system);




          const damagetrackMaxFunc = (system) => {
              return 5
          };
          const damagetrackMax = damagetrackMaxFunc(this.system);
          if ( this.system.damagetrack > damagetrackMax ) {
              this.system.damagetrack = damagetrackMax;
          }

          // Crisis Number Derived Data
          const crisisCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.crisis ?? 0
          };
          this.system.crisis = crisisCurrentValueFunc(this.system);



          // Level2 Number Derived Data
          const level2CurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.level2 ?? 0
          };
          this.system.level2 = level2CurrentValueFunc(this.system);



          // AvailableSkillLevels Number Derived Data
          const availableskilllevelsCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.availableskilllevels ?? 0
          };
          this.system.availableskilllevels = availableskilllevelsCurrentValueFunc(this.system);



          // Armors Document Array Derived Data
          this.system.armors = this.items.filter((item) => {
              if ( item.type !== "equipment") return false;
              return item.system.type === "Armor" ;
          });
          // Weapons Document Array Derived Data
          this.system.weapons = this.items.filter((item) => {
              if ( item.type !== "equipment") return false;
              return item.system.type === "Weapon" ;
          });
          // Potion Document Array Derived Data
          this.system.potion = this.items.filter((item) => item.type == "potion");
          // Spells Document Array Derived Data
          this.system.spells = this.items.filter((item) => item.type == "spell");
          // Skills Document Array Derived Data
          this.system.skills = this.items.filter((item) => item.type == "skill");
          // VuetifySpells Document Array Derived Data
          this.system.vuetifyspells = this.items.filter((item) => item.type == "spell");

          // Reapply Active Effects for calculated values
          this.reapplyActiveEffectsForName("system.experiencetrack");
          this.reapplyActiveEffectsForName("system.defense");
          this.reapplyActiveEffectsForName("system.damagetrack");
      }

      async _prepareNPCDerivedData() {
          const editMode = this.flags["kitchen-sink"]?.["edit-mode"] ?? true;

          // Level Number Derived Data
          const levelCurrentValueFunc = (system) => {
              const context = {
                  object: this
              };
              return system.level ?? 0
          };
          this.system.level = levelCurrentValueFunc(this.system);

          const levelMinFunc = (system) => {
              const context = {
                  object: this
              };
              return 1
          };
          const levelMin = levelMinFunc(this.system);
          if ( this.system.level < levelMin ) {
              this.system.level = levelMin;
          }


          const levelMaxFunc = (system) => {
              const context = {
                  object: this
              };
              return 7
          };
          const levelMax = levelMaxFunc(this.system);
          if ( this.system.level > levelMax ) {
              this.system.level = levelMax;
          }


          // Monster Attribute Derived Data
          const monsterCurrentValue = this.system.monster?.value ?? 0;
          const monsterCurrentMax = this.system.monster?.max ?? 0;
          const monsterModFunc = (system) => {
              const context = {
                  object: this
              };
              return monsterCurrentValue
          };
          this.system.monster = {
              value: monsterCurrentValue,
              max: monsterCurrentMax,
              mod: monsterModFunc(this.system)
          };
          if ( this.system.monster.value > this.system.monster.max ) {
              this.system.monster.value = this.system.monster.max;
          }
                          // Defense Number Calculated Data


                          

                          

                          // Defense Number Derived Data
                          const defenseCurrentValueFunc = (system) => {
                              const context = {
                                      object: this
                              };
                              if (system.armor != undefined) {
                                  return system.level + system.armor?.system?.bonus;
                              }
                              return system.level;
                          };
                          Object.defineProperty(this.system, "defense", {
                              get: () => {
                                  let current = defenseCurrentValueFunc(this.system);
                                  
                                  
                                  return current;
                              },
                              configurable: true
                          });

          // Equipment Document Array Derived Data
          this.system.equipment = this.items.filter((item) => {
              if ( item.type !== "equipment") return false;
              return item.system.type === "Armor" ;
          });

          // Reapply Active Effects for calculated values
          this.reapplyActiveEffectsForName("system.experiencetrack");
          this.reapplyActiveEffectsForName("system.defense");
          this.reapplyActiveEffectsForName("system.damagetrack");
      }

  
      /* -------------------------------------------- */

              async _preUpdate(data, options, userId) {
                  await super._preUpdate(data, options, userId);
                  if (!options.diff || data === undefined) return;
                  let changes = {};

                  // Foundry v12 no longer has diffed data during _preUpdate, so we need to compute it ourselves.
                  if (game.release.version >= 12) {
                      // Retrieve a copy of the existing actor data.
                      let newData = game.system.utils.flattenObject(data);
                      let oldData = game.system.utils.flattenObject(this);

                      // Limit data to just the new data.
                      const diffData = foundry.utils.diffObject(oldData, newData);
                      changes = foundry.utils.expandObject(diffData);
                  }
                  else {
                      changes = foundry.utils.duplicate(data);
                  }

                  // Handle name changes
                  if (changes.name) {
                      let tokenData = {};

                      // Propagate name update to prototype token if same as actor
                      if (changes.name && this.name == this.prototypeToken.name) {
                          data.prototypeToken = {name: data.name};
                      }

                      // Update tokens.
                      let tokens = this.getActiveTokens();
                      tokens.forEach(token => {
                          let updateData = foundry.utils.duplicate(tokenData);

                          // Propagate name update to token if same as actor
                          if (data.name && this.name == token.name) {
                              updateData.name = data.name;
                          }
                          token.document.update(updateData);
                      });
                  }

                  if (changes.system === undefined) return; // Nothing more to do

                  const deltas = {};

                  if (this.type == "hero") this._handlePreUpdateHeroDelta(changes, deltas);
                  if (this.type == "npc") this._handlePreUpdateNPCDelta(changes, deltas);

                  options.fromPreUpdate = deltas;
              }

              /* -------------------------------------------- */

              _handlePreUpdateHeroDelta(changes, deltas) {
                  // Health resource updates
                  if (changes.system.hp === undefined) return;

                  // Store value and temp changes
                  const valueChange = changes.system.hp.value;
                  const tempChange = changes.system.hp.temp;

                  // Calculate delta
                  if (valueChange !== undefined) {
                      const delta = valueChange - this.system.hp.value;
                      if (delta !== 0) {
                          deltas.hp = delta;
                      }
                  }

                  // Calculate temp delta
                  if (tempChange !== undefined) {
                      const tempDelta = tempChange - this.system.hp.temp;
                      if (tempDelta !== 0) {
                          deltas.hpTemp = tempDelta;
                      }
                  }
              }

              _handlePreUpdateNPCDelta(changes, deltas) {
                  // No health resource defined
              }


              /* -------------------------------------------- */

              async _onUpdate(data, options, userId) {
                  await super._onUpdate(data, options, userId);

                  // Iterate over all objects in fromPreUpdate, showing scrolling text for each.
                  if (options.fromPreUpdate) {
                      for (const [key, delta] of Object.entries(options.fromPreUpdate)) {
                          this._showScrollingText(delta, key);
                      }
                  }

                  // Add / remove status effects
                  const calculatedStatusEffects = CONFIG.statusEffects.filter(effect => effect.calculated);
                  for (const effect of calculatedStatusEffects) {
                      const key = effect.id;
                      const active = this.system[key] ?? false;
                      const existing = this.effects.find(e => e.statuses.has(key));

                      if ((active && existing) || (!active && !existing)) continue;

                      // If the effect is active the AE doesn't exist, add it
                      if (active && !existing) {
                          const cls = getDocumentClass("ActiveEffect");
                          const createData = foundry.utils.deepClone(effect);
                          createData.statuses = [key];
                          delete createData.id;
                          createData.name = game.i18n.localize(createData.name);
                          await cls.create(createData, {parent: this});
                          if (key == "dead") Hooks.callAll("death", this);
                      }

                      // If the effect is active the AE doesn't exist, add it
                      if (!active && existing) {
                          this.deleteEmbeddedDocuments("ActiveEffect", [existing.id]);
                      }
                  }
              }

              /* -------------------------------------------- */

              async _onCreate(data, options, userId) {
                  await super._onCreate(data, options, userId);

                  console.log("onCreate", data, options, userId);

                  switch ( data.type ) {
                      case "hero": {
                          // HP health resource

                          if ( !data.prototypeToken.bar1.attribute ) data.prototypeToken.bar1.attribute = "hp";
                          if ( !data.prototypeToken.displayBars ) data.prototypeToken.displayBars = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
                      }
                  }
              }

              /* -------------------------------------------- */

              _showScrollingText(delta, suffix="", overrideOptions={}) {
              // Show scrolling text of hp update
              const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
              if (delta != 0 && tokens.length > 0) {
                  let color = delta < 0 ? 0xcc0000 : 0x00cc00;
                  for ( let token of tokens ) {
                      let textOptions = {
                          anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
                          direction: CONST.TEXT_ANCHOR_POINTS.TOP,
                          fontSize: 32,
                          fill: color,
                          stroke: 0x000000,
                          strokeThickness: 4,
                          duration: 3000
                      };
                      canvas.interface.createScrollingText(
                          token.center,
                          delta.signedString()+" "+suffix,
                          foundry.utils.mergeObject(textOptions, overrideOptions)
                      );
                      // Flash dynamic token rings.
                      if (token?.ring) {
                          const flashColor = delta < 0 ? Color.fromString('#ff0000') : Color.fromString('#00ff00');
                          token.ring.flashColor(flashColor, {
                              duration: 600,
                              easing: foundry.canvas.tokens.TokenRing.easeTwoPeaks,
                          });
                      }
                  }
              }
          }

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
              case "hero": return this._registerHeroHooks(this);
              case "npc": return this._registerNPCHooks(this);
          }
      }

      /* -------------------------------------------- */

      _registerHeroHooks(document) {
          if (game.system.documentHooks.has("preApplyDamage-" + this.uuid)) return;
          const onpreApplyDamage = async (document, context) => {
              const preApply = async (damage) => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  if (system.shield.value > 0 ) {
                      let shieldAmount = system.shield.value;
                      if ( context.object.system.shield.temp > 0 ) {
                          update["system.shield.temp"] = context.object.system.shield.temp - damage;

                          if ( update["system.shield.temp"] < 0 ) {
                              // Apply the remainder to the system property
                              update["system.shield.value"] = context.object.system.shield.value + update["system.shield.temp"];
                              update["system.shield.temp"] = 0;
                          }
                      }
                      else {
                          update["system.shield.value"] = context.object.system.shield.value - damage;
                      }
                      if (damage > shieldAmount ) {
                          damage -= shieldAmount;
                      }
                      else {
                          damage = 0;
                      }
                  }

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
                  return damage;
              }
              if (document.uuid == this.uuid) {
                  context.amount = await preApply(context.amount);
              }
          }
          game.system.documentHooks.set("preApplyDamage-" + this.uuid, onpreApplyDamage);
          Hooks.on("preApplyDamage", onpreApplyDamage);
          if (game.system.documentHooks.has("appliedDamage-" + this.uuid)) return;
          const onappliedDamage = async (document, amount) => {
              const applied = async (damage) => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  if (system.hp.value <= 0 ) {
                      update["system.wounds.value"] = context.object.system.wounds.value + 1;
                      update["system.hp.value"] = system.endure.mod + 6;
                      if (system.wounds.value > 5 ) {
                          update["system.dead"] = true;
                          // Create the chat message
                          const DeathDescription = context.object.description ?? context.object.system.description;
                          const DeathContext = { 
                              cssClass: "kitchen-sink Death",
                              document: context.object,
                              description: DeathDescription,
                              hasDescription: DeathDescription!= "",
                              hasEffects: false,
                              parts: [
                              ],
                              tags: [
                              ]
                          };
                          const DeathContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", DeathContext);
                          const DeathChatFlavor = (system) => {
                              return ("You have died!")
                          }
                          await ChatMessage.create({
                              user: game.user._id,
                              speaker: ChatMessage.getSpeaker(),
                              content: DeathContent,
                              flavor: DeathChatFlavor(context.object.system),
                              type: DeathContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
                              rolls: Array.from(DeathContext.parts.filter(x => x.isRoll).map(x => x.value)),
                          });
                      }
                      else {
                          // Create the chat message
                          const WoundedDescription = context.object.description ?? context.object.system.description;
                          const WoundedContext = { 
                              cssClass: "kitchen-sink Wounded",
                              document: context.object,
                              description: WoundedDescription,
                              hasDescription: WoundedDescription!= "",
                              hasEffects: false,
                              parts: [
                              ],
                              tags: [
                              ]
                          };
                          const WoundedContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", WoundedContext);
                          const WoundedChatFlavor = (system) => {
                              return ("You are wounded! " + system.wounds.value + " Wounds remaining.")
                          }
                          await ChatMessage.create({
                              user: game.user._id,
                              speaker: ChatMessage.getSpeaker(),
                              content: WoundedContent,
                              flavor: WoundedChatFlavor(context.object.system),
                              type: WoundedContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
                              rolls: Array.from(WoundedContext.parts.filter(x => x.isRoll).map(x => x.value)),
                          });
                      }
                  }

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              }
              if (document.uuid == this.uuid) {
                  await applied(amount);
              }
          };
          game.system.documentHooks.set("appliedDamage-" + this.uuid, onappliedDamage);
          Hooks.on("appliedDamage", onappliedDamage);
          Hooks.on("combatStart", async () => {
              const KitchenSinkRoll = game.system.rollClass;
              const context = {
                  object: document,
                  target: game.user.getTargetOrNothing()
              };
              const system = document.system;
              let update = {};
              let embeddedUpdate = {};
              let parentUpdate = {};
              let parentEmbeddedUpdate = {};
              let targetUpdate = {};
              let targetEmbeddedUpdate = {};
              let selfDeleted = false;

              console.log("Combat started")
              update["system.count"] = 0;

              if (!selfDeleted && Object.keys(update).length > 0) {
                  await document.update(update);
              }
              if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                  for (let key of Object.keys(embeddedUpdate)) {
                      await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                  }
              }
              if (Object.keys(parentUpdate).length > 0) {
                  await document.parent.update(parentUpdate);
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
          });
          Hooks.on("deleteCombat", async () => {
              const KitchenSinkRoll = game.system.rollClass;
              const context = {
                  object: document,
                  target: game.user.getTargetOrNothing()
              };
              const system = document.system;
              let update = {};
              let embeddedUpdate = {};
              let parentUpdate = {};
              let parentEmbeddedUpdate = {};
              let targetUpdate = {};
              let targetEmbeddedUpdate = {};
              let selfDeleted = false;

              console.log("Combat ended")
              update["system.count"] = 0;

              if (!selfDeleted && Object.keys(update).length > 0) {
                  await document.update(update);
              }
              if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                  for (let key of Object.keys(embeddedUpdate)) {
                      await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                  }
              }
              if (Object.keys(parentUpdate).length > 0) {
                  await document.parent.update(parentUpdate);
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
          });
          Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
              const roundStart = async (roundNumber) => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  console.log("Round " + roundNumber)
                  update["system.count"] = 0;

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              }

              if (updateData.turn == 0) {
                  await roundStart(updateData.round);
              }
          });
          Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
              const roundEnd = async (roundNumber) => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  console.log("Round " + roundNumber + " ended")

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              }

              if (updateData.round > 0) {
                  roundEnd(updateData.round - 1);
              }
          });
          Hooks.on("combatTurnChange", async (combat, updateData, updateOptions) => {
              const turnStart = async () => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  console.log("Turn of " + context.object.name)

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              }
              if (combat.combatant.actor.uuid == document.uuid) {
                  await turnStart();
              }
          });
          Hooks.on("combatTurnChange", async (combat, updateData, updateOptions) => {
              const turnEnd = async () => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  console.log("Turn of " + context.object.name + " ended")

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              }
              const previousCombatant = combat.combatants.get(combat.previous?.combatantId);
              if (previousCombatant?.actor?.uuid == document.uuid) {
                  await turnEnd();
              }
          });
          Hooks.on("combatTurnChange", async (combat, updateData, updateOptions) => {
              const turnIsNext = async () => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  console.log("Turn of " + context.object.name + " is next")

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              };
              if (combat.nextCombatant.actor.uuid == document.uuid) {
                  await turnIsNext();
              }
          });
          Hooks.on("death", async (deadDocument) => {
              const onDeath = async () => {
                  const KitchenSinkRoll = game.system.rollClass;
                  const context = {
                      object: document,
                      target: game.user.getTargetOrNothing()
                  };
                  const system = document.system;
                  let update = {};
                  let embeddedUpdate = {};
                  let parentUpdate = {};
                  let parentEmbeddedUpdate = {};
                  let targetUpdate = {};
                  let targetEmbeddedUpdate = {};
                  let selfDeleted = false;

                  console.log("Death of " + context.object.name)

                  if (!selfDeleted && Object.keys(update).length > 0) {
                      await document.update(update);
                  }
                  if (!selfDeleted && Object.keys(embeddedUpdate).length > 0) {
                      for (let key of Object.keys(embeddedUpdate)) {
                          await document.updateEmbeddedDocuments("Item", embeddedUpdate[key]);
                      }
                  }
                  if (Object.keys(parentUpdate).length > 0) {
                      await document.parent.update(parentUpdate);
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
              };
              if ( deadDocument.uuid == document.uuid ) {
                  await onDeath();
              }
          });
      }

      _registerNPCHooks(document) {
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
          for ( const item of this.items ) {
              for ( const effect of item.effects ) {
                  if ( effect.transfer ) yield getTypedEffect(this.type, edit, effect, item.name);
              }
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

      /* -------------------------------------------- */

      getInitiativeFormula() {
          switch ( this.type ) {
              case "hero": return "0";
              case "npc": return "0";
          }
      }

  }
