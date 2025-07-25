<script setup>
    import { ref, watch, inject, computed, watchEffect } from "vue";
    import HeroHeroSpellsDatatable from './components/datatables/heroHeroSpellsDatatable.vue';
    import HeroHeroSkillsVuetifyDatatable from './components/datatables/heroHeroSkillsVuetifyDatatable.vue';
    import HeroHeroVuetifySpellsVuetifyDatatable from './components/datatables/heroHeroVuetifySpellsVuetifyDatatable.vue';
    import HeroPlainFieldsSkillsTableVuetifyDatatable from './components/datatables/heroPlainFieldsSkillsTableVuetifyDatatable.vue';
    import HeroEquipmentArmorsVuetifyDatatable from './components/datatables/heroEquipmentArmorsVuetifyDatatable.vue';
import HeroequipmentWeaponsDatatable from './components/datatables/heroequipmentWeaponsDatatable.vue';
    import HeroequipmentPotionDatatable from './components/datatables/heroequipmentPotionDatatable.vue';
    import heroExecuteMacroAction from './components/actions/heroExecuteMacroAction.vue';
    import heroFlipACoinAction from './components/actions/heroFlipACoinAction.vue';
    import heroEndCombatAction from './components/actions/heroEndCombatAction.vue';
    import heroNextTurnAction from './components/actions/heroNextTurnAction.vue';
    import heroLevelUpAction from './components/actions/heroLevelUpAction.vue';
    import heroResetAction from './components/actions/heroResetAction.vue';
    import heroIncrementAction from './components/actions/heroIncrementAction.vue';
    import heroDecrementAction from './components/actions/heroDecrementAction.vue';
    import heroIncrement2Action from './components/actions/heroIncrement2Action.vue';
    import heroDecrement2Action from './components/actions/heroDecrement2Action.vue';
    import heroReset2Action from './components/actions/heroReset2Action.vue';
    import heroRecoverAction from './components/actions/heroRecoverAction.vue';
    import heroRefillAction from './components/actions/heroRefillAction.vue';
    import heroHealAction from './components/actions/heroHealAction.vue';
    import heroRollAction from './components/actions/heroRollAction.vue';
    import heroHealDamageTrackAction from './components/actions/heroHealDamageTrackAction.vue';
    import heroTakeBashingAction from './components/actions/heroTakeBashingAction.vue';
    import heroChoiceFieldDocumentChoice from './components/document-choices/heroChoiceFieldDocumentChoice.vue';
    import KitchenSinkRoll from "../../../../rolls/roll.mjs";
    import DataTable from 'datatables.net-vue3';
    import DataTablesCore from 'datatables.net-dt';
    import 'datatables.net-responsive-dt';
    import 'datatables.net-colreorder-dt';
    import 'datatables.net-rowreorder-dt';
    import 'datatables.net-buttons-dt';
    import ColVis from "datatables.net-buttons/js/buttons.colVis";

    DataTable.use(DataTablesCore);
    DataTable.use(ColVis);

    const document = inject('rawDocument');
    const props = defineProps(['context']);

    // Colors
    let storedColors = game.settings.get('kitchen-sink', 'documentColorThemes');
    const primaryColor = ref(storedColors[document.uuid]?.primary ?? '#1565c0');
    const secondaryColor = ref(storedColors[document.uuid]?.secondary ?? '#4db6ac');
    const tertiaryColor = ref(storedColors[document.uuid]?.tertiary ?? '#ffb74d');

    const setupColors = () => {
        const colors = {
            primary: primaryColor.value,
            secondary: secondaryColor.value,
            tertiary: tertiaryColor.value
        };
        game.settings.set('kitchen-sink', 'documentColorThemes', { ...storedColors, [document.uuid]: colors });
    };
    const resetColors = () => {
        primaryColor.value = '#1565c0';
        secondaryColor.value = '#4db6ac';
        teritaryColor.value = '#ffb74d';
        setupColors();
    };

    watch(primaryColor, () => {
        setupColors();
    });
    watch(secondaryColor, () => {
        setupColors();
    });
    watch(tertiaryColor, () => {
        setupColors();
    });

    // Pages and Tabs
    const lastStates = game.settings.get('kitchen-sink', 'documentLastState');
    const lastState = lastStates[document.uuid] ?? {
        page: 'hero',
        tab: 'description'
    };

    const drawer = ref(false);
    const page = ref(lastState.page);
    const tab = ref(lastState.tab);
    const pageDefaultTabs = {
        'hero': 'description',
        'plainfields': 'description',
        'info': 'description',
        'stats': 'description',
        'equipment': 'weapons'
    };

    const updateLastState = () => {
        const lastStates = game.settings.get('kitchen-sink', 'documentLastState');
        lastStates[document.uuid] = { page: page.value, tab: tab.value };
        game.settings.set('kitchen-sink', 'documentLastState', lastStates);
    };

    // When the page changes, reset the tab to the first tab on that page
    watch(page, () => {
        tab.value = pageDefaultTabs[page.value.toLowerCase()];
        document.sheet.dragDrop.forEach((d) => d.bind(document.sheet.element));
        // Dismiss the drawer when the page changes
        drawer.value = false;
        updateLastState();
    });

    watch(tab, () => {
        document.sheet.dragDrop.forEach((d) => d.bind(document.sheet.element));
        updateLastState();
    });

    const pageBackgrounds = {
        'hero': 'topography',
        'plainfields': 'topography',
        'info': 'hideout',
        'stats': 'bricks',
        'equipment': 'food'
    };

    const pageBackground = computed(() => {
        if (editModeRef.value) {
            return 'edit-mode';
        }
        if (props.context.system.dead) {
            return 'dead';
        }
        return pageBackgrounds[page.value];
    });

    // Edit Mode
    const editModeRef = ref(document.getFlag('kitchen-sink', 'edit-mode') ?? true);
    const hovered = ref(false);

    const toggleEditMode = () => {
        editModeRef.value = !editModeRef.value;
        document.setFlag('kitchen-sink', 'edit-mode', editModeRef.value);
    };

    function spawnDatatableWindow(e, pageName, tabName) {
        if (event.button === 1) {
            event.preventDefault();
            event.stopPropagation();
            const tableName = `actorHero${pageName}${tabName}`;
            const systemName = "system." + tabName.toLowerCase();
            const sheet = new game.system.datatableApp(document, tableName, systemName, tabName);
            sheet.render(true);
        }
    }

    // Effects
    const effects = ref([]);

    function updateEffects() {
        effects.value = Array.from(document.allApplicableEffects());
    }

    updateEffects();

    Hooks.on("createActiveEffect", updateEffects);
    Hooks.on("updateActiveEffect", updateEffects);
    Hooks.on("deleteActiveEffect", updateEffects);

    const getEffect = (id) => {
        let ae = document.effects.get(id);
        if (ae) return ae;
        ae = document.items.find(i => i.effects.has(id)).effects.get(id);
        if (!ae) {
            console.error("Could not find effect with id: " + id);
            return;
        }
        return ae;
    }

    const editEffect = (rowData) => {
        const effect = getEffect(rowData._id);
        effect.sheet.render(true);
    };

    const toggleEffect = (rowData) => {
        const effect = getEffect(rowData._id);
        effect.disabled = !effect.disabled;
        rowData.disabled = effect.disabled;
        document.updateEmbeddedDocuments("ActiveEffect", [effect]);
    };

    const sendEffectToChat = async (rowData) => {
        const effect = getEffect(rowData._id);
        const chatDescription = effect.description ?? effect.system.description;
        const content = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", { 
            cssClass: "kitchen-sink",
            document: effect,
            hasEffects: false,
            description: chatDescription,
            hasDescription: chatDescription != ""
        });
        ChatMessage.create({
            content: content,
            speaker: ChatMessage.getSpeaker(),
            style: CONST.CHAT_MESSAGE_STYLES.IC
        });
    };

    const deleteEffect = async (rowData) => {
        const effect = getEffect(rowData._id);
        const shouldDelete = await Dialog.confirm({
            title: "Delete Confirmation",
            content: `<p>Are you sure you would like to delete the "${effect.name}" Active Effect?</p>`,
            defaultYes: false
        });
        if ( shouldDelete ) {
            effect.delete();
            updateEffects();
        }
    };

    const effectsColumns = [
        { 
            data: 'img', 
            title: game.i18n.localize("Image"),
            render: '#image',
            responsivePriority: 1,
            orderable: false,
        },
        { 
            data: 'name',
            title: game.i18n.localize("Name"),
            responsivePriority: 1,
            width: '200px',
            render: function (data, type, context) {
                if (type === 'display') {
                    return `<span data-tooltip="${context.description}">${data}</span>`;
                }
                return data;
            }
        },
        {
            data: 'origin',
            title: game.i18n.localize("Source"),
        },
        { 
            data: null,
            title: game.i18n.localize("Actions"),
            render: '#actions',
            orderable: false,
            width: '200px'
        }
    ];

    const effectsOptions = {
        paging: false,
        stateSave: true,
        responsive: true,
        colReorder: false,
        order: [[1, 'asc']],
        createdRow: (row, data) => {
            console.dir(data, data.uuid);
            row.setAttribute("data-id", data._id);
            row.setAttribute("data-uuid", data.uuid);
            row.setAttribute("data-type", 'ActiveEffect');
        },
        layout: {
            topStart: {
                buttons: [
                    {
                        text: '<i class="fas fa-plus"></i> Add',
                        action: (e, dt, node, config) => {
                            ActiveEffect.createDocuments([{label: "New Effect"}], {parent: document}).then(effect => {
                                effect[0].sheet.render(true);
                            });
                        }
                    },
                    'colvis'
                ]
            }
        }
    };
    
    // Combat
    const currentCombatant = ref(game.combat?.combatant);
    Hooks.on("combatTurnChange", () => {
        currentCombatant.value = game.combat?.combatant;
    });

    // Paper Doll Slots
    const paperdollfieldSlots = [
        {
            name: 'A',
            systemPath: 'system.paperdollfield.a',
            type: 'skill',
            left: '0px',
            top: '0px'
        },
        {
            name: 'B',
            systemPath: 'system.paperdollfield.b',
            type: 'skill',
            left: '50px',
            top: '50px'
        }
    ];

    // Visibility states
    const visibilityStates = {
        'availableskilllevels': computed(() => {
            return 'hidden';
        })
        ,
        'spells': computed(() => {
            return 'default';
        })
        ,
        'skills': computed(() => {
            return 'default';
        })
        ,
        'vuetifyspells': computed(() => {
            return 'default';
        })
        ,
        'stringfield': computed(() => {
            return 'default';
        })
        ,
        'numberfield': computed(() => {
            return 'default';
        })
        ,
        'booleanfield': computed(() => {
            return 'default';
        })
        ,
        'htmlfield': computed(() => {
            return 'default';
        })
        ,
        'resourcefield': computed(() => {
            return 'default';
        })
        ,
        'trackerfield': computed(() => {
            return 'default';
        })
        ,
        'attributefield': computed(() => {
            return 'default';
        })
        ,
        'measuredtemplatefield': computed(() => {
            return 'default';
        })
        ,
        'datefield': computed(() => {
            return 'default';
        })
        ,
        'timefield': computed(() => {
            return 'default';
        })
        ,
        'datetimefield': computed(() => {
            return 'default';
        })
        ,
        'diefield': computed(() => {
            return 'default';
        })
        ,
        'skillstable': computed(() => {
            return 'default';
        })
        ,
        'singledocumentfield': computed(() => {
            return 'default';
        })
        ,
        'choicefield': computed(() => {
            return 'default';
        })
        ,
        'macrofield': computed(() => {
            return 'default';
        })
        ,
        'paperdollfield': computed(() => {
            return 'default';
        })
        ,
        'experience': computed(() => {
            return 'default';
        })
        ,
        'herotype': computed(() => {
            return 'gmOnly';
        })
        ,
        'damagetype': computed(() => {
            return 'default';
        })
        ,
        'summary': computed(() => {
            return 'default';
        })
        ,
        'text2': computed(() => {
            return 'locked';
        })
        ,
        'background': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                return "hidden";
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'backgroundtext': computed(() => {
            return 'hidden';
        })
        ,
        'time': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (system.outoftime ) {
                    return "hidden";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'timepassed': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (system.outoftime ) {
                    return "hidden";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'outoftime': computed(() => {
            return 'default';
        })
        ,
        'level': computed(() => {
            return 'default';
        })
        ,
        'plain': computed(() => {
            return 'locked';
        })
        ,
        'experiencetrack': computed(() => {
            return 'default';
        })
        ,
        'fate': computed(() => {
            return 'gmOnly';
        })
        ,
        'shield': computed(() => {
            return 'secret';
        })
        ,
        'wounds': computed(() => {
            return 'default';
        })
        ,
        'heat': computed(() => {
            return 'gmEdit';
        })
        ,
        'fight': computed(() => {
            return 'default';
        })
        ,
        'flight': computed(() => {
            return 'default';
        })
        ,
        'endure': computed(() => {
            return 'default';
        })
        ,
        'persuade': computed(() => {
            return 'default';
        })
        ,
        'grit': computed(() => {
            return 'default';
        })
        ,
        'slowed': computed(() => {
            return 'default';
        })
        ,
        'dazed': computed(() => {
            return 'default';
        })
        ,
        'count': computed(() => {
            return 'readonly';
        })
        ,
        'count2': computed(() => {
            return 'readonly';
        })
        ,
        'fancycounteramount': computed(() => {
            return 'unlocked';
        })
        ,
        'something': computed(() => {
            return 'default';
        })
        ,
        'anotherthing': computed(() => {
            return 'unlocked';
        })
        ,
        'armor': computed(() => {
            return 'default';
        })
        ,
        'armors': computed(() => {
            return 'default';
        })
        ,
        'weapons': computed(() => {
            return 'default';
        })
        ,
        'potion': computed(() => {
            return 'default';
        })
        ,
        'hp': computed(() => {
            return 'default';
        })
        ,
        'defense': computed(() => {
            return 'locked';
        })
        ,
        'stealth': computed(() => {
            return 'default';
        })
        ,
        'stagger': computed(() => {
            return 'default';
        })
        ,
        'mana': computed(() => {
            return 'default';
        })
        ,
        'damagetrack': computed(() => {
            return 'default';
        })
        ,
        'crisis': computed(() => {
            return 'readonly';
        })
        ,
        'level2': computed(() => {
            return 'default';
        })
        ,
        'damage': computed(() => {
            return 'default';
        })
        ,
        'executemacro': computed(() => {
            return 'default';
        })
        ,
        'flipacoin': computed(() => {
            return 'default';
        })
        ,
        'endcombat': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (game.user.isGM ) {
                    return "default";
                }
                else {
                    return "readonly";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'nextturn': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (game.combat && game.combat.combatant?.actor?.uuid != context.actor?.uuid ) {
                    return "locked";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'levelup': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (context.object.system.experience.value < 10 ) {
                    return "locked";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'reset': computed(() => {
            return 'default';
        })
        ,
        'increment': computed(() => {
            return 'default';
        })
        ,
        'decrement': computed(() => {
            return 'default';
        })
        ,
        'increment2': computed(() => {
            return 'default';
        })
        ,
        'decrement2': computed(() => {
            return 'default';
        })
        ,
        'reset2': computed(() => {
            return 'default';
        })
        ,
        'recover': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (context.object.system.stagger.value < 1 ) {
                    return "locked";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'refill': computed(() => {
            let editMode = editModeRef.value;
            let combatant = currentCombatant.value; // This will kick the recalc when changed
            let update = {};
            let embeddedUpdate = {};
            let parentUpdate = {};
            let parentEmbeddedUpdate = {};
            let targetUpdate = {};
            let targetEmbeddedUpdate = {};
            let selfDeleted = false;
            let rerender = false;
            const context = {
                object: document,
                target: game.user.getTargetOrNothing()
            };
            // If this is an item, attach the parent
            if (document.documentName === "Item" && document.parent) {
                context.actor = document.parent;
            }
            else {
                context.actor = document;
            }
            const visibility = (system) => {
                if (context.object.system.mana.value === context.object.system.mana?.max ) {
                    return "locked";
                }
            };
            const returnedVisibility = visibility(props.context.system);
            
            return returnedVisibility ?? "default";
        })
        ,
        'heal': computed(() => {
            return 'default';
        })
        ,
        'roll': computed(() => {
            return 'default';
        })
        ,
        'healdamagetrack': computed(() => {
            return 'default';
        })
        ,
        'takebashing': computed(() => {
            return 'default';
        })
    };


    const isHidden = (type) => {
        const visibility = visibilityStates[type].value;
        if (visibility === "hidden") {
            return true;
        }
        if (visibility === "gmOnly") {
            return !game.user.isGM;
        }
        if (visibility === "secret") {
            const isGm = game.user.isGM;
            const isOwner = document.getUserLevel(game.user) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
            return !isGm && !isOwner;
        }
        if (visibility === "edit") {
            return !editModeRef.value;
        }

        // Default to visible
        return false;
    };

    const isDisabled = (type) => {
        const visibility = visibilityStates[type].value;
        const disabledStates = ["readonly", "locked"];
        if (disabledStates.includes(visibility)) {
            return true;
        }
        if (visibility === "gmEdit") {
            const isGm = game.user.isGM;
            const isEditMode = editModeRef.value;
            return !isGm && !isEditMode;
        }

        if (visibility === "unlocked") {
            return false;
        }
        
        // Default to enabled while in editMode
        return !editModeRef.value;
    };

    const getLabel = (label, icon) => {
        const localized = game.i18n.localize(label);
        if (icon) {
            return `<i class="${icon}"></i> ${localized}`;
        }
        return localized;
    };
    
    // Attribute roll methods
const onFightAttributeRoll = async () => {
        const context = {
            object: document
        };
        const roll = await new KitchenSinkRoll("d20" + "+" + `@fight[Fight]`, {"fight": context.object.system.fight.mod ?? 0}).roll();
        // Create the chat message
        const FightDescription = context.object.description ?? context.object.system.description;
        const FightContext = { 
            cssClass: "kitchen-sink Fight",
            document: context.object,
            description: FightDescription,
            hasDescription: FightDescription!= "",
            parts: [
                {
                    label: "Fight Attribute Roll",
                    value: roll,
                    isRoll: true,
                    wide: true, 
                    tooltip: await roll.getTooltip()
                }
            ],
            tags: []
        };
        const FightContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", FightContext);
        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: FightContent,
            flavor: "",
            type: FightContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
            rolls: Array.from(FightContext.parts.filter(x => x.isRoll).map(x => x.value)),
        });
    };
    const onGritAttributeRoll = async () => {
        const context = {
            object: document
        };
        const roll = await new KitchenSinkRoll("d20" + "+" + `@grit[Grit]`, {"grit": context.object.system.grit.mod ?? 0}).roll();
        // Create the chat message
        const GritDescription = context.object.description ?? context.object.system.description;
        const GritContext = { 
            cssClass: "kitchen-sink Grit",
            document: context.object,
            description: GritDescription,
            hasDescription: GritDescription!= "",
            parts: [
                {
                    label: "Grit Attribute Roll",
                    value: roll,
                    isRoll: true,
                    wide: true, 
                    tooltip: await roll.getTooltip()
                }
            ],
            tags: []
        };
        const GritContent = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", GritContext);
        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: GritContent,
            flavor: "",
            type: GritContext.parts.find(x => x.isRoll) ? null : CONST.CHAT_MESSAGE_STYLES.IC,
            rolls: Array.from(GritContext.parts.filter(x => x.isRoll).map(x => x.value)),
        });
    };
</script>
<style>
</style>
<template>
    <v-app>
        <!-- App Bar -->
        <v-app-bar :color="editMode ? 'amber-accent-3' : primaryColor" density="comfortable">
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-app-bar-title v-if="!editMode">{{ context.document.name }}</v-app-bar-title>
            <v-text-field name="name" v-model="context.document.name" variant="outlined" class="document-name" v-if="editMode" density="compact"></v-text-field>
            <v-alert :text="game.i18n.localize('EditModeWarning')" type="warning" density="compact" class="ga-2 ma-1" color="amber-accent-3" v-if="editMode"></v-alert>
            <template v-slot:append>
                <v-btn
                    :icon="hovered ? (editMode ? 'fa-solid fa-dice-d20' : 'fa-solid fa-pen-to-square') : (editMode ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-dice-d20')"
                    @click="toggleEditMode"
                    @mouseover="hovered = true"
                    @mouseleave="hovered = false"
                    :data-tooltip="editMode ? 'Swap to Play mode' : 'Swap to Edit mode'"
                ></v-btn>
            </template>
        </v-app-bar>

        <!-- Navigation Drawer -->
        <v-navigation-drawer v-model="drawer" temporary style="background-color: #dddddd">
            <v-img :src="context.document.img" style="background-color: lightgray" data-edit='img' data-action='onEditImage'>
                <template #error>
                    <v-img src="/systems/kitchen-sink/img/missing-character.png" data-edit='img' data-action='onEditImage'></v-img>
                </template>
            </v-img>
            <v-tabs v-model="page" direction="vertical">
                <v-tab value="hero" prepend-icon="fa-solid fa-circle-user">Hero</v-tab>
                <v-tab value="plainfields" prepend-icon="fa-solid fa-page">{{ game.i18n.localize('PlainFields') }}</v-tab>
                <v-tab value="info" prepend-icon="fa-solid fa-page">{{ game.i18n.localize('Info') }}</v-tab>
                <v-tab value="stats" prepend-icon="fa-solid fa-chart-line">{{ game.i18n.localize('Stats') }}</v-tab>
                <v-tab value="equipment" prepend-icon="fa-solid fa-backpack">{{ game.i18n.localize('Equipment') }}</v-tab>
            </v-tabs>
            <template v-slot:append>
                <div class="pa-2">
                    <v-btn block @click="setupColors" :color="secondaryColor" prepend-icon="fa-solid fa-palette">
                    Setup Colors

                    <v-dialog activator="parent" max-width="1000">
                    <template v-slot:default="{ isActive }">
                    <v-card
                        title="Setup Colors"
                    >
                        <v-card-text>
                            <div class="d-flex flex-row">
                                <div class="d-flex flex-column">
                                    <v-label>Primary Color</v-label>
                                    <v-color-picker hide-inputs hide-sliders hide-canvas show-swatches v-model="primaryColor" swatches-max-height="500px"></v-color-picker>
                                </div>
                                <v-spacer></v-spacer>
                                <div class="d-flex flex-column">
                                    <v-label>Secondary Color</v-label>
                                    <v-color-picker hide-inputs hide-sliders hide-canvas show-swatches v-model="secondaryColor" swatches-max-height="500px"></v-color-picker>
                                </div>
                                <v-spacer></v-spacer>
                                <div class="d-flex flex-column">
                                    <v-label>Tertiary Color</v-label>
                                    <v-color-picker hide-inputs hide-sliders hide-canvas show-swatches v-model="tertiaryColor" swatches-max-height="500px"></v-color-picker>
                                </div>
                            </div>
                            <h3>Preview</h3>
                            <div class="d-flex flex-row"style="overflow-x: scroll; padding-left: 0.5rem; padding-right: 0.5rem;">
                                <div
                                    v-for="i in 10"
                                    :key="i"
                                    :style="{
                                        flex: 1,
                                        minWidth: '5px',
                                        flexShrink: 0,
                                        height: '30px',
                                        backgroundColor: i <= 4 ? primaryColor : (i <= 6 ? tertiaryColor : 'transparent'),
                                        border: i <= value ? 'none' : '2px solid ' + secondaryColor,
                                        transform: 'skewX(-20deg)',
                                        borderRadius: '2px'
                                    }"
                                />
                            </div>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn
                                variant="tonal"
                                prepend-icon="fa-solid fa-sync"
                                text="Reset"
                                :color="secondaryColor"
                                @click="resetColors"
                            ></v-btn>
                        </v-card-actions>
                    </v-card>
                    </template>
                </v-dialog>
                    </v-btn>
                </div>
            </template>
        </v-navigation-drawer>

        <!-- Main Content -->
        <v-main class="d-flex">
            <v-container :key="editMode" :class="pageBackground" fluid>
                <v-tabs-window v-model="page">
                    <v-tabs-window-item value="hero" data-tab="hero">
                        <v-row dense>
<v-col class="section">
                                <v-card variant="outlined" elevation="4">
                                    <v-card-title>{{ game.i18n.localize('Hero.Health') }}</v-card-title>

                                    <v-card-text>
                                        <v-row dense>
                            <v-row dense>
                                                <i-tracker 
                                                    label="Hero.HP"
                                                    systemPath="system.hp" :context="context" 
                                                    :visibility="visibilityStates['hp'].value"
                                                    :editMode="editMode"
                                                    :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                    trackerStyle="bar"
                                                    icon="fa-solid fa-heart" 
                                                    :hideMin="true"
                                                    :disableMin="false"
                                                    :disableValue="false"
                                                    :disableMax="true"
                                                    :segments="1"
                                                    :isHealth="true"
                                                    :isWounds="false"
                                                    ></i-tracker>
                                                <v-number-input
                                                    controlVariant="stacked"
                                                    density="compact"
                                                    variant="outlined"
                                                     append-inner-icon="fa-solid fa-function" control-variant="hidden" class="calculated-number" :model-value="context.system.defense"
                                                    name="system.defense"
                                                    :disabled="isDisabled('defense')" v-if="!isHidden('defense')"
                                                >
                                                
                <template #label>
                    <span v-html="getLabel('Hero.Defense', undefined)" />
                </template>

                                                </v-number-input>
                                                <v-number-input
                                                    controlVariant="stacked"
                                                    density="compact"
                                                    variant="outlined"
                                                    v-model="context.system.stealth"
                                                    name="system.stealth"
                                                    :disabled="isDisabled('stealth')" v-if="!isHidden('stealth')"
                                                >
                                                
                <template #label>
                    <span v-html="getLabel('Hero.Stealth', undefined)" />
                </template>
                                                
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.stealth'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                                </v-number-input>
                                            </v-row>
                                            <v-row dense>
                                                <i-tracker 
                                                    label="Hero.Stagger"
                                                    systemPath="system.stagger" :context="context" 
                                                    :visibility="visibilityStates['stagger'].value"
                                                    :editMode="editMode"
                                                    :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                    trackerStyle="bar"
                                                    icon="" 
                                                    :hideMin="true"
                                                    :disableMin="false"
                                                    :disableValue="false"
                                                    :disableMax="true"
                                                    :segments="1"
                                                    :isHealth="false"
                                                    :isWounds="false"
                                                    ></i-tracker>
                                                <heroRecoverAction 
                                                    :context="context" 
                                                    :color="primaryColor"
                                                    :editMode="editMode" 
                                                    :visibility="visibilityStates['recover'].value">
                                                </heroRecoverAction>
                                            </v-row>
                                            <v-row dense>
                                                <v-col>
                                                    <i-tracker 
                                                        label="Hero.Mana"
                                                        systemPath="system.mana" :context="context" 
                                                        :visibility="visibilityStates['mana'].value"
                                                        :editMode="editMode"
                                                        :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                        trackerStyle="bar"
                                                        icon="" 
                                                        :hideMin="true"
                                                        :disableMin="false"
                                                        :disableValue="false"
                                                        :disableMax="true"
                                                        :segments="1"
                                                        :isHealth="false"
                                                        :isWounds="false"
                                                        ></i-tracker>
                                                    <heroRefillAction 
                                                        :context="context" 
                                                        :color="primaryColor"
                                                        :editMode="editMode" 
                                                        :visibility="visibilityStates['refill'].value">
                                                    </heroRefillAction>
                                                </v-col>
                                            </v-row>
                                            <v-row dense>
                                            <v-number-input
                                                    controlVariant="stacked"
                                                    density="compact"
                                                    variant="outlined"
                                                    v-model="context.system.crisis"
                                                    name="system.crisis"
                                                    :disabled="isDisabled('crisis')" v-if="!isHidden('crisis')"
                                                >
                                                
                <template #label>
                    <span v-html="getLabel('Hero.Crisis', undefined)" />
                </template>
                                                
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.crisis'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                                </v-number-input>
                                                <heroHealAction 
                                                    :context="context" 
                                                    :color="primaryColor"
                                                    :editMode="editMode" 
                                                    :visibility="visibilityStates['heal'].value">
                                                </heroHealAction>
                                                <v-number-input
                                                    controlVariant="stacked"
                                                    density="compact"
                                                    variant="outlined"
                                                    v-model="context.system.level2"
                                                    name="system.level2"
                                                    :disabled="isDisabled('level2')" v-if="!isHidden('level2')"
                                                >
                                                
                <template #label>
                    <span v-html="getLabel('Hero.Level2', undefined)" />
                </template>
                                                
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.level2'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                                </v-number-input>
                                                <heroRollAction 
                                                    :context="context" 
                                                    :color="primaryColor"
                                                    :editMode="editMode" 
                                                    :visibility="visibilityStates['roll'].value">
                                                </heroRollAction>
                                            </v-row>
                                        </v-row>
                                   </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col class="section">
                                <v-card variant="outlined" elevation="4">
                                    <v-card-title>{{ game.i18n.localize('Hero.Damage') }}</v-card-title>

                                    <v-card-text>
                                        <v-row dense>
                                            <v-alert text="Unknown Property Damage" type="warning" density="compact" class="ga-2 ma-1" variant="outlined"></v-alert>
                                            <heroHealDamageTrackAction 
                                                :context="context" 
                                                :color="primaryColor"
                                                :editMode="editMode" 
                                                :visibility="visibilityStates['healdamagetrack'].value">
                                            </heroHealDamageTrackAction>
                                            <heroTakeBashingAction 
                                                :context="context" 
                                                :color="primaryColor"
                                                :editMode="editMode" 
                                                :visibility="visibilityStates['takebashing'].value">
                                            </heroTakeBashingAction>
                                        </v-row>
                                   </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                        <v-divider class="mt-4 mb-2"></v-divider>
                        <v-tabs v-model="tab" grow always-center>
                                <v-tab value="description" prepend-icon="fa-solid fa-book">Description</v-tab>
                                <v-tab value="spells" prepend-icon="fa-solid fa-table" @mousedown="spawnDatatableWindow($event, 'Hero', 'Spells')">{{ game.i18n.localize('Spells') }}</v-tab>
                                <v-tab value="skills" prepend-icon="fa-solid fa-table" @mousedown="spawnDatatableWindow($event, 'Hero', 'Skills')">{{ game.i18n.localize('Skills') }}</v-tab>
                                <v-tab value="vuetifyspells" prepend-icon="fa-solid fa-table" @mousedown="spawnDatatableWindow($event, 'Hero', 'VuetifySpells')">{{ game.i18n.localize('VuetifySpells') }}</v-tab>
                                <v-tab value="effects" prepend-icon="fa-solid fa-sparkles" @mousedown="spawnDatatableWindow($event, 'Hero', 'effects')">Effects</v-tab>
                        </v-tabs>
                        <v-tabs-window v-model="tab" class="tabs-window">
                            <v-tabs-window-item value="description" data-tab="description" class="tabs-container">
                                <i-prosemirror :field="context.editors['system.description']" :disabled="!editMode"></i-prosemirror>
                            </v-tabs-window-item>
                            <v-tabs-window-item value="spells" data-tab="spells" data-type="spell" class="tabs-container">
                                <HeroHeroSpellsDatatable systemPath="system.spells" :context="context"></HeroHeroSpellsDatatable>
                            </v-tabs-window-item>

                            <v-tabs-window-item value="skills" data-tab="skills" data-type="table" class="tabs-container">
                                <HeroHeroSkillsVuetifyDatatable systemPath="system.skills" :context="context" :primaryColor="primaryColor" :secondaryColor="secondaryColor" :teritaryColor="teritaryColor"></HeroHeroSkillsVuetifyDatatable>
                            </v-tabs-window-item>

                            <v-tabs-window-item value="vuetifyspells" data-tab="vuetifyspells" data-type="table" class="tabs-container">
                                <HeroHeroVuetifySpellsVuetifyDatatable systemPath="system.vuetifyspells" :context="context" :primaryColor="primaryColor" :secondaryColor="secondaryColor" :teritaryColor="teritaryColor"></HeroHeroVuetifySpellsVuetifyDatatable>
                            </v-tabs-window-item>

                            <v-tabs-window-item value="effects" data-tab="effects" class="tabs-container">
                                <DataTable class="display compact" :data="effects" :columns="effectsColumns" :options="effectsOptions">
                                    <template #image="props">
                                        <img :src="props.cellData" width=40 height=40></img>
                                    </template>
                                    <template #actions="props">
                                        <div class="flexrow">
                                            <a 
                                                class="row-action" 
                                                data-action="toggle" 
                                                @click="toggleEffect(props.rowData)" 
                                                :data-tooltip="game.i18n.localize(props.rowData.disabled ? 'Enable' : 'Disable')">
                                                <i :class="props.rowData.disabled ? 'fas fa-toggle-off' : 'fas fa-toggle-on'"></i>
                                            </a>
                                            <a class="row-action" data-action="edit" @click="editEffect(props.rowData)" :data-tooltip="game.i18n.localize('Edit')"><i class="fas fa-edit"></i></a>
                                            <a class="row-action" data-action="sendToChat" @click="sendEffectToChat(props.rowData)" :data-tooltip="game.i18n.localize('SendToChat')"><i class="fas fa-message"></i></a>
                                            <a class="row-action" data-action="delete" @click="deleteEffect(props.rowData)" :data-tooltip="game.i18n.localize('Delete')"><i class="fas fa-delete-left"></i></a>
                                        </div>
                                    </template>
                                </DataTable>
                            </v-tabs-window-item>
                        </v-tabs-window>
                    </v-tabs-window-item>
                <v-tabs-window-item value="plainfields" data-tab="plainfields">
                    <v-row dense>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.Basic') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <i-text-field 
                                            label="Hero.StringField"
                                            icon=""
                                            systemPath="system.stringfield"
                                            :disabled="isDisabled('stringfield')" v-if="!isHidden('stringfield')"
                                            :context="context"
                                            :editMode="editMode" 
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor">
                                        </i-text-field>
                                        <v-number-input
                                            controlVariant="stacked"
                                            density="compact"
                                            variant="outlined"
                                            v-model="context.system.numberfield"
                                            name="system.numberfield"
                                            :disabled="isDisabled('numberfield')" v-if="!isHidden('numberfield')"
                                        >
                                        
                <template #label>
                    <span v-html="getLabel('Hero.NumberField', undefined)" />
                </template>
                                        
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.numberfield'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                        </v-number-input>
                                        <v-checkbox
                                            v-model="context.system.booleanfield"
                                            name="system.booleanfield"
                                            :disabled="isDisabled('booleanfield')" v-if="!isHidden('booleanfield')"
                                            :color="primaryColor">
                                            
                <template #label>
                    <span v-html="getLabel('Hero.BooleanField', undefined)" />
                </template>
                                        </v-checkbox>
                                        <i-prosemirror
                                            label="Hero.HtmlField"
                                            icon=""
                                            :field="context.editors['system.htmlfield']"
                                            :disabled="isDisabled('htmlfield')" v-if="!isHidden('htmlfield')">
                                        </i-prosemirror>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.Complex') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <i-tracker 
                                            label="Hero.ResourceField"
                                            systemPath="system.resourcefield" :context="context" 
                                            :visibility="visibilityStates['resourcefield'].value"
                                            :editMode="editMode"
                                            :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                            trackerStyle="bar"
                                            icon="" 
                                            :hideMin="true"
                                            :disableMin="false"
                                            :disableValue="false"
                                            :disableMax="false"
                                            :segments="1"
                                            :isHealth="false"
                                            :isWounds="false"
                                            ></i-tracker>
                                        <i-tracker 
                                            label="Hero.TrackerField"
                                            systemPath="system.trackerfield" :context="context" 
                                            :visibility="visibilityStates['trackerfield'].value"
                                            :editMode="editMode"
                                            :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                            trackerStyle="bar"
                                            icon="" 
                                            :hideMin="false"
                                            :disableMin="false"
                                            :disableValue="false"
                                            :disableMax="false"
                                            :segments="1"
                                            :isHealth="false"
                                            :isWounds="false"
                                            ></i-tracker>
                                        <i-attribute 
                                            label="Hero.AttributeField"
                                            icon=""
                                            attributeStyle="box"
                                            :editMode="editMode"
                                            :hasMod="false" 
                                            :mod="context.system.attributefield.mod"
                                            systemPath="system.attributefield.value" 
                                            :context="context" 
                                            :min="0" 
                                            :disabled="isDisabled('attributefield')" v-if="!isHidden('attributefield')"
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor"
                                            :roll="undefined"
                                            :hasRoll="false"
                                            >
                                        </i-attribute>
                                        <i-measured-template
                                            :context="context"
                                            label="Hero.MeasuredTemplateField"
                                            icon=""
                                            systemPath="system.measuredtemplatefield"
                                            :primaryColor="primaryColor"
                                            :secondaryColor="secondaryColor"
                                            :disabled="isDisabled('measuredtemplatefield')" v-if="!isHidden('measuredtemplatefield')">
                                        </i-measured-template>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.DateTime') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <i-datetime 
                                            type="date" 
                                            label="Hero.DateField"
                                            icon=""
                                            systemPath="system.datefield" 
                                            :context="context" 
                                            :disabled="isDisabled('datefield')" v-if="!isHidden('datefield')"
                                            :primaryColor="primaryColor" :secondaryColor="secondaryColor">
                                        </i-datetime>
                                        <i-datetime 
                                            type="time" 
                                            label="Hero.TimeField"
                                            icon=""
                                            systemPath="system.timefield" 
                                            :context="context" 
                                            :disabled="isDisabled('timefield')" v-if="!isHidden('timefield')"
                                            :primaryColor="primaryColor" :secondaryColor="secondaryColor">
                                        </i-datetime>
                                        <i-datetime 
                                            type="datetime-local" 
                                            label="Hero.DateTimeField"
                                            icon=""
                                            systemPath="system.datetimefield" 
                                            :context="context" 
                                            :disabled="isDisabled('datetimefield')" v-if="!isHidden('datetimefield')"
                                            :primaryColor="primaryColor" :secondaryColor="secondaryColor">
                                        </i-datetime>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.Dice') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <v-select 
                                            name="system.diefield" 
                                            v-model="context.system.diefield" 
                                            :items="[ 'd4', 'd6', 'd8', 'd10', 'd12', 'd20' ]" 
                                            :disabled="isDisabled('diefield')" v-if="!isHidden('diefield')" 
                                            variant="outlined" 
                                            density="compact">
                                            <template #label>
                                                <span v-html="getLabel('Hero.DieField', )" />
                                            </template>
                                            <template #prepend-inner>
                                                <i :class="'fa-solid fa-dice-' + context.system.diefield"></i>
                                            </template>
                                        </v-select>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.DocumentLinks') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <HeroPlainFieldsSkillsTableVuetifyDatatable systemPath="system.skillstable" :context="context" :primaryColor="primaryColor" :secondaryColor="secondaryColor" :teritaryColor="teritaryColor"></HeroPlainFieldsSkillsTableVuetifyDatatable>
                                        <i-document-link 
                                            label="Hero.SingleDocumentField"
                                            icon=""
                                            systemPath="system.singledocumentfield" 
                                            documentName="skill" 
                                            :context="context" 
                                            :disabled="isDisabled('singledocumentfield')" v-if="!isHidden('singledocumentfield')" 
                                            :secondaryColor="secondaryColor">
                                        </i-document-link>
                                        <heroChoiceFieldDocumentChoice
                                            label="Hero.ChoiceField"
                                            icon=""
                                            :context="context"
                                            :editMode="editMode"
                                            :disabled="isDisabled('choicefield')" v-if="!isHidden('choicefield')"
                                            :primaryColor="primaryColor"
                                            :secondaryColor="secondaryColor">
                                        </heroChoiceFieldDocumentChoice>
                                        <i-macro
                                            label="Hero.MacroField"
                                            icon=""
                                            systemPath="system.macrofield"
                                            :disabled="isDisabled('macrofield')" v-if="!isHidden('macrofield')"
                                            :context="context"
                                            :editMode="editMode"
                                            :primaryColor="primaryColor"
                                            :secondaryColor="secondaryColor">
                                        </i-macro>
                                        <i-paperdoll 
                                            label="Hero.PaperdollField"
                                            icon=""
                                            systemPath="system.paperdollfield" 
                                            :context="context" 
                                            :disabled="isDisabled('paperdollfield')" v-if="!isHidden('paperdollfield')"
                                            image="systems/kitchen-sink/img/paperdoll_default.png" 
                                            size="40px" 
                                            :slots="paperdollfieldSlots">
                                        </i-paperdoll>
                                        <heroExecuteMacroAction 
                                            :context="context" 
                                            :color="primaryColor"
                                            :editMode="editMode" 
                                            :visibility="visibilityStates['executemacro'].value">
                                        </heroExecuteMacroAction>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    <v-divider class="mt-4 mb-2"></v-divider>
                    <v-tabs v-model="tab" grow always-center>
                    </v-tabs>
                    <v-tabs-window v-model="tab" class="tabs-window">
                    </v-tabs-window>
                </v-tabs-window-item>
                <v-tabs-window-item value="info" data-tab="info">
                    <v-row dense>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.BasicInfo') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <i-extended-choice
                                            label="Hero.HeroType.label"
                                            icon="fa-solid fa-cube"
                                            systemPath="system.herotype.value"
                                            :context="context"
                                            :items="[{ label: game.i18n.localize('Hero.HeroType.A'), value: 'A', icon: '', color: '' },
                                            { label: game.i18n.localize('Hero.HeroType.B'), value: 'B', icon: '', color: '' },
                                            { label: game.i18n.localize('Hero.HeroType.C'), value: 'C', icon: '', color: '' }
                                            ]"
                                            :primaryColor="primaryColor"
                                            :secondaryColor="secondaryColor"
                                            :disabled="isDisabled('herotype')" v-if="!isHidden('herotype')" color="#a586c0"
                                        ></i-extended-choice>
                                        <i-extended-choice
                                            label="Hero.DamageType.label"
                                            icon=""
                                            systemPath="system.damagetype.value"
                                            :context="context"
                                            :items="[{ label: game.i18n.localize('Hero.DamageType.Cutting'), value: 'Cutting', icon: '', color: '' },
                                            { label: game.i18n.localize('Hero.DamageType.Piercing'), value: 'Piercing', icon: '', color: '' },
                                            { label: game.i18n.localize('Hero.DamageType.Bludgeoning'), value: 'Bludgeoning', icon: '', color: '' }
                                            ]"
                                            :primaryColor="primaryColor"
                                            :secondaryColor="secondaryColor"
                                            :disabled="isDisabled('damagetype')" v-if="!isHidden('damagetype')"
                                        ></i-extended-choice>
                                        <i-text-field 
                                            label="Hero.Summary"
                                            icon="fa-solid fa-info-circle"
                                            systemPath="system.summary"
                                            :disabled="isDisabled('summary')" v-if="!isHidden('summary')" color="#a586c0"
                                            :context="context"
                                            :editMode="editMode" 
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor">
                                        </i-text-field>
                                        <v-text-field 
                                            name="system.text2"
                                            v-model="context.system.text2" 
                                            :disabled="isDisabled('text2')" v-if="!isHidden('text2')" color="#a586c0"
                                            variant="outlined" 
                                            density="compact"
                                            append-inner-icon="fa-solid fa-function" 
                                            :data-tooltip="context.system.text2">
                                            
                <template #label>
                    <span v-html="getLabel('Hero.Text2', 'fa-solid fa-book')" />
                </template>
                                        </v-text-field>
                                        <i-prosemirror
                                            label="Hero.Background"
                                            icon="fa-solid fa-scroll"
                                            :field="context.editors['system.background']"
                                            :disabled="isDisabled('background')" v-if="!isHidden('background')" color="#a586c0">
                                        </i-prosemirror>
                                        <heroEndCombatAction 
                                            :context="context" 
                                            :color="primaryColor"
                                            :editMode="editMode" 
                                            :visibility="visibilityStates['endcombat'].value">
                                        </heroEndCombatAction>
                                        <heroNextTurnAction 
                                            :context="context" 
                                            :color="primaryColor"
                                            :editMode="editMode" 
                                            :visibility="visibilityStates['nextturn'].value">
                                        </heroNextTurnAction>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.Level') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <v-row dense>
                                            <i-tracker 
                                                label="Hero.Fate"
                                                systemPath="system.fate" :context="context" 
                                                :visibility="visibilityStates['fate'].value"
                                                :editMode="editMode"
                                                :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                trackerStyle="icons"
                                                icon="fa-bolt-lightning" 
                                                :hideMin="false"
                                                :disableMin="true"
                                                :disableValue="false"
                                                :disableMax="false"
                                                :segments="1"
                                                :isHealth="false"
                                                :isWounds="false"
                                                ></i-tracker>
                                            <i-tracker 
                                                label="Hero.Shield"
                                                systemPath="system.shield" :context="context" 
                                                :visibility="visibilityStates['shield'].value"
                                                :editMode="editMode"
                                                :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                trackerStyle="segmented"
                                                icon="fa-solid fa-shield-halved" 
                                                :hideMin="false"
                                                :disableMin="true"
                                                :disableValue="false"
                                                :disableMax="false"
                                                :segments="5"
                                                :isHealth="false"
                                                :isWounds="false"
                                                ></i-tracker>
                                        </v-row>
                                        <v-row dense>
                                            <i-tracker 
                                                label="Hero.Wounds"
                                                systemPath="system.wounds" :context="context" 
                                                :visibility="visibilityStates['wounds'].value"
                                                :editMode="editMode"
                                                :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                trackerStyle="slashes"
                                                icon="" 
                                                :hideMin="false"
                                                :disableMin="false"
                                                :disableValue="false"
                                                :disableMax="false"
                                                :segments="1"
                                                :isHealth="false"
                                                :isWounds="false"
                                                ></i-tracker>
                                            <i-tracker 
                                                label="Hero.Heat"
                                                systemPath="system.heat" :context="context" 
                                                :visibility="visibilityStates['heat'].value"
                                                :editMode="editMode"
                                                :primaryColor="primaryColor" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                                trackerStyle="dial"
                                                icon="" 
                                                :hideMin="false"
                                                :disableMin="false"
                                                :disableValue="false"
                                                :disableMax="false"
                                                :segments="1"
                                                :isHealth="false"
                                                :isWounds="false"
                                                ></i-tracker>
                                        </v-row>
                                        <i-tracker 
                                            label="Hero.Time"
                                            systemPath="system.time" :context="context" 
                                            :visibility="visibilityStates['time'].value"
                                            :editMode="editMode"
                                            :primaryColor="'#a586c0'" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                            trackerStyle="clock"
                                            icon="" 
                                            :hideMin="false"
                                            :disableMin="false"
                                            :disableValue="false"
                                            :disableMax="false"
                                            :segments="5"
                                            :isHealth="false"
                                            :isWounds="false"
                                            ></i-tracker>
                                        <v-number-input
                                            controlVariant="stacked"
                                            density="compact"
                                            variant="outlined"
                                            v-model="context.system.timepassed"
                                            name="system.timepassed"
                                            :disabled="isDisabled('timepassed')" v-if="!isHidden('timepassed')" color="#a586c0"
                                        >
                                        
                <template #label>
                    <span v-html="getLabel('Hero.TimePassed', 'fa-solid fa-hourglass-half')" />
                </template>
                                        
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.timepassed'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                        </v-number-input>
                                        <v-checkbox
                                            v-model="context.system.outoftime"
                                            name="system.outoftime"
                                            :disabled="isDisabled('outoftime')" v-if="!isHidden('outoftime')" color="#a586c0"
                                            :color="primaryColor">
                                            
                <template #label>
                    <span v-html="getLabel('Hero.OutOfTime', 'fa-solid fa-hourglass-end')" />
                </template>
                                        </v-checkbox>
                                        <v-number-input
                                            controlVariant="stacked"
                                            density="compact"
                                            variant="outlined"
                                            v-model="context.system.level"
                                            name="system.level"
                                            :disabled="isDisabled('level')" v-if="!isHidden('level')"
                                        >
                                        
                <template #label>
                    <span v-html="getLabel('Hero.Level', 'fa-solid fa-cube')" />
                </template>
                                        
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.level'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                        </v-number-input>
                                        <i-tracker 
                                            label="Hero.Plain"
                                            systemPath="system.plain" :context="context" 
                                            :visibility="visibilityStates['plain'].value"
                                            :editMode="editMode"
                                            :primaryColor="'#a586c0'" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                                            trackerStyle="plain"
                                            icon="" 
                                            :hideMin="false"
                                            :disableMin="false"
                                            :disableValue="true"
                                            :disableMax="false"
                                            :segments="1"
                                            :isHealth="false"
                                            :isWounds="false"
                                            ></i-tracker>
                                        <heroLevelUpAction 
                                            :context="context" 
                                            :color="'#a586c0'"
                                            :editMode="editMode" 
                                            :visibility="visibilityStates['levelup'].value">
                                        </heroLevelUpAction>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <i-tracker 
                            label="Hero.Experience"
                            systemPath="system.experience" :context="context" 
                            :visibility="visibilityStates['experience'].value"
                            :editMode="editMode"
                            :primaryColor="'#a586c0'" :secondaryColor="secondaryColor" :tertiaryColor="tertiaryColor"
                            trackerStyle="bar"
                            icon="" 
                            :hideMin="false"
                            :disableMin="true"
                            :disableValue="false"
                            :disableMax="true"
                            :segments="1"
                            :isHealth="false"
                            :isWounds="false"
                            ></i-tracker>
                        <heroFlipACoinAction 
                            :context="context" 
                            :color="primaryColor"
                            :editMode="editMode" 
                            :visibility="visibilityStates['flipacoin'].value">
                        </heroFlipACoinAction>
                    </v-row>
                    <v-divider class="mt-4 mb-2"></v-divider>
                    <v-tabs v-model="tab" grow always-center>
                    </v-tabs>
                    <v-tabs-window v-model="tab" class="tabs-window">
                    </v-tabs-window>
                </v-tabs-window-item>
                <v-tabs-window-item value="stats" data-tab="stats">
                    <v-row dense>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.Attributes') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <i-attribute 
                                            label="Hero.Fight"
                                            icon="fa-solid fa-hand-fist"
                                            attributeStyle="box"
                                            :editMode="editMode"
                                            :hasMod="true" 
                                            :mod="context.system.fight.mod"
                                            systemPath="system.fight.value" 
                                            :context="context" 
                                            :min="1" 
                                            :disabled="isDisabled('fight')" v-if="!isHidden('fight')" color="#a586c0"
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor"
                                            :roll="onFightAttributeRoll"
                                            :hasRoll="true"
                                            >
                                        </i-attribute>
                                        <i-attribute 
                                            label="Hero.Flight"
                                            icon=""
                                            attributeStyle="box"
                                            :editMode="editMode"
                                            :hasMod="true" 
                                            :mod="context.system.flight.mod"
                                            systemPath="system.flight.value" 
                                            :context="context" 
                                            :min="1" 
                                            :disabled="isDisabled('flight')" v-if="!isHidden('flight')"
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor"
                                            :roll="undefined"
                                            :hasRoll="false"
                                            >
                                        </i-attribute>
                                        <i-attribute 
                                            label="Hero.Endure"
                                            icon=""
                                            attributeStyle="box"
                                            :editMode="editMode"
                                            :hasMod="true" 
                                            :mod="context.system.endure.mod"
                                            systemPath="system.endure.value" 
                                            :context="context" 
                                            :min="1" 
                                            :disabled="isDisabled('endure')" v-if="!isHidden('endure')"
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor"
                                            :roll="undefined"
                                            :hasRoll="false"
                                            >
                                        </i-attribute>
                                        <i-attribute 
                                            label="Hero.Persuade"
                                            icon=""
                                            attributeStyle="box"
                                            :editMode="editMode"
                                            :hasMod="true" 
                                            :mod="context.system.persuade.mod"
                                            systemPath="system.persuade.value" 
                                            :context="context" 
                                            :min="1" 
                                            :disabled="isDisabled('persuade')" v-if="!isHidden('persuade')"
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor"
                                            :roll="undefined"
                                            :hasRoll="false"
                                            >
                                        </i-attribute>
                                        <i-attribute 
                                            label="Hero.Grit"
                                            icon=""
                                            attributeStyle="plain"
                                            :editMode="editMode"
                                            :hasMod="false" 
                                            :mod="context.system.grit.mod"
                                            systemPath="system.grit.value" 
                                            :context="context" 
                                            :min="1" 
                                            :disabled="isDisabled('grit')" v-if="!isHidden('grit')"
                                            :primaryColor="primaryColor" 
                                            :secondaryColor="secondaryColor"
                                            :roll="onGritAttributeRoll"
                                            :hasRoll="true"
                                            >
                                        </i-attribute>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.StatusEffects') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <v-checkbox
                                            v-model="context.system.slowed"
                                            name="system.slowed"
                                            :disabled="isDisabled('slowed')" v-if="!isHidden('slowed')"
                                            :color="primaryColor">
                                            
                <template #label>
                    <span v-html="getLabel('Hero.Slowed', undefined)" />
                </template>
                                        </v-checkbox>
                                        <v-checkbox
                                            v-model="context.system.dazed"
                                            name="system.dazed"
                                            :disabled="isDisabled('dazed')" v-if="!isHidden('dazed')"
                                            :color="primaryColor">
                                            
                <template #label>
                    <span v-html="getLabel('Hero.Dazed', undefined)" />
                </template>
                                        </v-checkbox>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                        <v-row dense>
                            <v-col class="section">
                                <v-card variant="outlined" elevation="4">
                                    <v-card-title>{{ game.i18n.localize('Hero.Counter') }}</v-card-title>

                                    <v-card-text>
                                        <v-row dense>
                                            <v-col>
                                                <v-number-input
                                                    controlVariant="stacked"
                                                    density="compact"
                                                    variant="outlined"
                                                    v-model="context.system.count"
                                                    name="system.count"
                                                    :disabled="isDisabled('count')" v-if="!isHidden('count')"
                                                >
                                                
                <template #label>
                    <span v-html="getLabel('Hero.Count', undefined)" />
                </template>
                                                
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.count'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                                </v-number-input>
                                                <heroResetAction 
                                                    :context="context" 
                                                    :color="primaryColor"
                                                    :editMode="editMode" 
                                                    :visibility="visibilityStates['reset'].value">
                                                </heroResetAction>
                                            </v-col>
                                            <v-col>
                                                <heroIncrementAction 
                                                    :context="context" 
                                                    :color="primaryColor"
                                                    :editMode="editMode" 
                                                    :visibility="visibilityStates['increment'].value">
                                                </heroIncrementAction>
                                                <heroDecrementAction 
                                                    :context="context" 
                                                    :color="primaryColor"
                                                    :editMode="editMode" 
                                                    :visibility="visibilityStates['decrement'].value">
                                                </heroDecrementAction>
                                            </v-col>
                                        </v-row>
                                   </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col class="section">
                                <v-card variant="outlined" elevation="4">
                                    <v-card-title>{{ game.i18n.localize('Hero.FancyCounter') }}</v-card-title>

                                    <v-card-text>
                                        <v-row dense>
                                            <v-number-input
                                                controlVariant="stacked"
                                                density="compact"
                                                variant="outlined"
                                                v-model="context.system.count2"
                                                name="system.count2"
                                                :disabled="isDisabled('count2')" v-if="!isHidden('count2')"
                                            >
                                            
                <template #label>
                    <span v-html="getLabel('Hero.Count2', undefined)" />
                </template>
                                            
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.count2'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                            </v-number-input>
                                            <v-number-input
                                                controlVariant="stacked"
                                                density="compact"
                                                variant="outlined"
                                                v-model="context.system.fancycounteramount"
                                                name="system.fancycounteramount"
                                                :disabled="isDisabled('fancycounteramount')" v-if="!isHidden('fancycounteramount')"
                                            >
                                            
                <template #label>
                    <span v-html="getLabel('Hero.FancyCounterAmount', undefined)" />
                </template>
                                            
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.fancycounteramount'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                            </v-number-input>
                                            <heroIncrement2Action 
                                                :context="context" 
                                                :color="primaryColor"
                                                :editMode="editMode" 
                                                :visibility="visibilityStates['increment2'].value">
                                            </heroIncrement2Action>
                                            <heroDecrement2Action 
                                                :context="context" 
                                                :color="primaryColor"
                                                :editMode="editMode" 
                                                :visibility="visibilityStates['decrement2'].value">
                                            </heroDecrement2Action>
                                            <heroReset2Action 
                                                :context="context" 
                                                :color="primaryColor"
                                                :editMode="editMode" 
                                                :visibility="visibilityStates['reset2'].value">
                                            </heroReset2Action>
                                        </v-row>
                                   </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                        <v-col class="section">
                            <v-card variant="outlined" elevation="4">
                                <v-card-title>{{ game.i18n.localize('Hero.Test') }}</v-card-title>

                                <v-card-text>
                                    <v-row dense>
                                        <v-number-input
                                            controlVariant="stacked"
                                            density="compact"
                                            variant="outlined"
                                            v-model="context.system.something"
                                            name="system.something"
                                            :disabled="isDisabled('something')" v-if="!isHidden('something')"
                                        >
                                        
                <template #label>
                    <span v-html="getLabel('Hero.SomeThing', undefined)" />
                </template>
                                        
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.something'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                        </v-number-input>
                                        <v-number-input
                                            controlVariant="stacked"
                                            density="compact"
                                            variant="outlined"
                                            v-model="context.system.anotherthing"
                                            name="system.anotherthing"
                                            :disabled="isDisabled('anotherthing')" v-if="!isHidden('anotherthing')"
                                        >
                                        
                <template #label>
                    <span v-html="getLabel('Hero.AnotherThing', undefined)" />
                </template>
                                        
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.anotherthing'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                                        </v-number-input>
                                    </v-row>
                               </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    <v-divider class="mt-4 mb-2"></v-divider>
                    <v-tabs v-model="tab" grow always-center>
                    </v-tabs>
                    <v-tabs-window v-model="tab" class="tabs-window">
                    </v-tabs-window>
                </v-tabs-window-item>
                <v-tabs-window-item value="equipment" data-tab="equipment">
                    <v-row dense>
                        <i-document-link 
                            label="Hero.Armor"
                            icon=""
                            systemPath="system.armor" 
                            documentName="equipment" 
                            :context="context" 
                            :disabled="isDisabled('armor')" v-if="!isHidden('armor')" 
                            :secondaryColor="secondaryColor">
                        </i-document-link>
                    </v-row>
                    <v-divider class="mt-4 mb-2"></v-divider>
                    <v-tabs v-model="tab" grow always-center>
                        <v-tab value="weapons" prepend-icon="fa-solid fa-table" @mousedown="spawnDatatableWindow($event, 'Equipment', 'Weapons')">{{ game.i18n.localize('Weapons') }}</v-tab>
                        <v-tab value="potion" prepend-icon="fa-solid fa-table" @mousedown="spawnDatatableWindow($event, 'Equipment', 'Potion')">{{ game.i18n.localize('Potion') }}</v-tab>
                        <v-tab value="armors" prepend-icon="fa-solid fa-table" @mousedown="spawnDatatableWindow($event, 'Equipment', 'Armors')">{{ game.i18n.localize('Armors') }}</v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="tab" class="tabs-window">
                        <v-tabs-window-item value="weapons" data-tab="weapons" data-type="equipment" class="tabs-container">
                            <HeroequipmentWeaponsDatatable systemPath="system.weapons" :context="context"></HeroequipmentWeaponsDatatable>
                        </v-tabs-window-item>

                        <v-tabs-window-item value="potion" data-tab="potion" data-type="potion" class="tabs-container">
                            <HeroequipmentPotionDatatable systemPath="system.potion" :context="context"></HeroequipmentPotionDatatable>
                        </v-tabs-window-item>

                        <v-tabs-window-item value="armors" data-tab="armors" data-type="table" class="tabs-container">
                            <HeroEquipmentArmorsVuetifyDatatable systemPath="system.armors" :context="context" :primaryColor="primaryColor" :secondaryColor="secondaryColor" :teritaryColor="teritaryColor"></HeroEquipmentArmorsVuetifyDatatable>
                        </v-tabs-window-item>

                    </v-tabs-window>
                </v-tabs-window-item>
                </v-tabs-window>
            </v-container>
        </v-main>
    </v-app>
</template>
