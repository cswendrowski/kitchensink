<script setup>
    import { ref, watch, inject, computed, watchEffect } from "vue";
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
        page: 'equipment',
        tab: 'description'
    };

    const drawer = ref(false);
    const page = ref(lastState.page);
    const tab = ref(lastState.tab);
    const pageDefaultTabs = {
        'equipment': 'description',
        'parentrefs': 'description'
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
        'equipment': 'topography',
        'parentrefs': 'topography'
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
            const tableName = `itemEquipment${pageName}${tabName}`;
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

    // Visibility states
    const visibilityStates = {
        'type': computed(() => {
            return 'default';
        })
        ,
        'bonus': computed(() => {
            return 'default';
        })
        ,
        'parentattribute': computed(() => {
            return 'default';
        })
        ,
        'parentresource': computed(() => {
            return 'default';
        })
        ,
        'parentnumber': computed(() => {
            return 'default';
        })
        ,
        'parentboolean': computed(() => {
            return 'default';
        })
        ,
        'parentdate': computed(() => {
            return 'default';
        })
        ,
        'parenttime': computed(() => {
            return 'default';
        })
        ,
        'parentdatetime': computed(() => {
            return 'default';
        })
        ,
        'parentdie': computed(() => {
            return 'default';
        })
        ,
        'parentstring': computed(() => {
            return 'default';
        })
        ,
        'parenttracker': computed(() => {
            return 'default';
        })
        ,
        'parentchoice': computed(() => {
            return 'default';
        })
        ,
        'parentpaperdoll': computed(() => {
            return 'default';
        })
        ,
        'parenthtml': computed(() => {
            return 'default';
        })
        ,
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
                <v-tab value="equipment" prepend-icon="fa-solid fa-circle-user">Equipment</v-tab>
                <v-tab value="parentrefs" prepend-icon="fa-solid fa-page">{{ game.i18n.localize('ParentRefs') }}</v-tab>
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
                    <v-tabs-window-item value="equipment" data-tab="equipment">
                        <v-row dense>
                            <v-select 
                                name="system.type" 
                                v-model="context.system.type" 
                                :items="[{ label: game.i18n.localize('Equipment.Type.Armor'), value: 'Armor' }, { label: game.i18n.localize('Equipment.Type.Weapon'), value: 'Weapon' }]" 
                                item-title="label" 
                                item-value="value" 
                                :disabled="isDisabled('type')" v-if="!isHidden('type')"
                                variant="outlined" 
                                density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.Type.label', )" />
                                </template>
                            </v-select>
                            <v-number-input
                                controlVariant="stacked"
                                density="compact"
                                variant="outlined"
                                v-model="context.system.bonus"
                                name="system.bonus"
                                :disabled="isDisabled('bonus')" v-if="!isHidden('bonus')"
                            >
                            
                <template #label>
                    <span v-html="getLabel('Equipment.Bonus', undefined)" />
                </template>
                            
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.bonus'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                            </v-number-input>
                        </v-row>
                        <v-divider class="mt-4 mb-2"></v-divider>
                        <v-tabs v-model="tab" grow always-center>
                                <v-tab value="description" prepend-icon="fa-solid fa-book">Description</v-tab>
                                <v-tab value="effects" prepend-icon="fa-solid fa-sparkles" @mousedown="spawnDatatableWindow($event, 'Equipment', 'effects')">Effects</v-tab>
                        </v-tabs>
                        <v-tabs-window v-model="tab" class="tabs-window">
                            <v-tabs-window-item value="description" data-tab="description" class="tabs-container">
                                <i-prosemirror :field="context.editors['system.description']" :disabled="!editMode"></i-prosemirror>
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
                <v-tabs-window-item value="parentrefs" data-tab="parentrefs">
                    <v-row dense>
                        <v-select 
                            name="system.parentattribute" 
                            v-model="context.system.parentattribute" 
                            :items="[{ label: 'Hero - AttributeField', value: 'system.attributefield' }, { label: 'Hero - Fight', value: 'system.fight' }, { label: 'Hero - Flight', value: 'system.flight' }, { label: 'Hero - Endure', value: 'system.endure' }, { label: 'Hero - Persuade', value: 'system.persuade' }, { label: 'Hero - Grit', value: 'system.grit' }, { label: 'NPC - Monster', value: 'system.monster' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentattribute')" v-if="!isHidden('parentattribute')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentAttribute', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentresource" 
                            v-model="context.system.parentresource" 
                            :items="[{ label: 'Hero - ResourceField', value: 'system.resourcefield' }, { label: 'Hero - HP', value: 'system.hp' }, { label: 'Hero - Stagger', value: 'system.stagger' }, { label: 'Hero - Mana', value: 'system.mana' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentresource')" v-if="!isHidden('parentresource')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentResource', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentnumber" 
                            v-model="context.system.parentnumber" 
                            :items="[{ label: 'Hero - AvailableSkillLevels', value: 'system.availableskilllevels' }, { label: 'Hero - NumberField', value: 'system.numberfield' }, { label: 'Hero - TimePassed', value: 'system.timepassed' }, { label: 'Hero - Level', value: 'system.level' }, { label: 'Hero - Count', value: 'system.count' }, { label: 'Hero - Count2', value: 'system.count2' }, { label: 'Hero - FancyCounterAmount', value: 'system.fancycounteramount' }, { label: 'Hero - SomeThing', value: 'system.something' }, { label: 'Hero - AnotherThing', value: 'system.anotherthing' }, { label: 'Hero - Defense', value: 'system.defense' }, { label: 'Hero - Stealth', value: 'system.stealth' }, { label: 'Hero - Crisis', value: 'system.crisis' }, { label: 'Hero - Level2', value: 'system.level2' }, { label: 'NPC - Level', value: 'system.level' }, { label: 'NPC - Defense', value: 'system.defense' }, { label: 'Skill - SkillMod', value: 'system.skillmod' }, { label: 'Skill - Skill', value: 'system.skill' }, { label: 'Equipment - Bonus', value: 'system.bonus' }, { label: 'Spell - Level', value: 'system.level' }, { label: 'Spell - Cost', value: 'system.cost' }, { label: 'Potion - Quantity', value: 'system.quantity' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentnumber')" v-if="!isHidden('parentnumber')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentNumber', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentboolean" 
                            v-model="context.system.parentboolean" 
                            :items="[{ label: 'Hero - BooleanField', value: 'system.booleanfield' }, { label: 'Hero - OutOfTime', value: 'system.outoftime' }, { label: 'Hero - Slowed', value: 'system.slowed' }, { label: 'Hero - Dazed', value: 'system.dazed' }, { label: 'Skill - Trained', value: 'system.trained' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentboolean')" v-if="!isHidden('parentboolean')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentBoolean', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentdate" 
                            v-model="context.system.parentdate" 
                            :items="[{ label: 'Hero - DateField', value: 'system.datefield' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentdate')" v-if="!isHidden('parentdate')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentDate', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parenttime" 
                            v-model="context.system.parenttime" 
                            :items="[{ label: 'Hero - TimeField', value: 'system.timefield' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parenttime')" v-if="!isHidden('parenttime')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentTime', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentdatetime" 
                            v-model="context.system.parentdatetime" 
                            :items="[{ label: 'Hero - DateTimeField', value: 'system.datetimefield' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentdatetime')" v-if="!isHidden('parentdatetime')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentDateTime', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentdie" 
                            v-model="context.system.parentdie" 
                            :items="[{ label: 'Hero - DieField', value: 'system.diefield' }, { label: 'Skill - Die', value: 'system.die' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentdie')" v-if="!isHidden('parentdie')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentDie', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentstring" 
                            v-model="context.system.parentstring" 
                            :items="[{ label: 'Hero - StringField', value: 'system.stringfield' }, { label: 'Hero - Summary', value: 'system.summary' }, { label: 'Hero - Text2', value: 'system.text2' }, { label: 'Hero - BackgroundText', value: 'system.backgroundtext' }, { label: 'Equipment - Type', value: 'system.type' }, { label: 'Spell - Summary', value: 'system.summary' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentstring')" v-if="!isHidden('parentstring')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentString', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parenttracker" 
                            v-model="context.system.parenttracker" 
                            :items="[{ label: 'Hero - TrackerField', value: 'system.trackerfield' }, { label: 'Hero - Experience', value: 'system.experience' }, { label: 'Hero - Time', value: 'system.time' }, { label: 'Hero - Plain', value: 'system.plain' }, { label: 'Hero - Fate', value: 'system.fate' }, { label: 'Hero - Shield', value: 'system.shield' }, { label: 'Hero - Wounds', value: 'system.wounds' }, { label: 'Hero - Heat', value: 'system.heat' }, { label: 'Skill - UsesLeft', value: 'system.usesleft' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parenttracker')" v-if="!isHidden('parenttracker')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentTracker', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentchoice" 
                            v-model="context.system.parentchoice" 
                            :items="[{ label: 'Hero - ChoiceField', value: 'system.choicefield' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentchoice')" v-if="!isHidden('parentchoice')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentChoice', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parentpaperdoll" 
                            v-model="context.system.parentpaperdoll" 
                            :items="[{ label: 'Hero - PaperdollField', value: 'system.paperdollfield' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parentpaperdoll')" v-if="!isHidden('parentpaperdoll')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentPaperdoll', )" />
                                </template>
                        </v-select>
                        <v-select 
                            name="system.parenthtml" 
                            v-model="context.system.parenthtml" 
                            :items="[{ label: 'Hero - HtmlField', value: 'system.htmlfield' }, { label: 'Hero - Background', value: 'system.background' }]" 
                            item-title="label" 
                            item-value="value" 
                            :disabled="isDisabled('parenthtml')" v-if="!isHidden('parenthtml')" 
                            variant="outlined" 
                            class="double-wide"
                            density="compact">
                                <template #label>
                                    <span v-html="getLabel('Equipment.ParentHtml', )" />
                                </template>
                        </v-select>
                    </v-row>
                    <v-divider class="mt-4 mb-2"></v-divider>
                    <v-tabs v-model="tab" grow always-center>
                    </v-tabs>
                    <v-tabs-window v-model="tab" class="tabs-window">
                    </v-tabs-window>
                </v-tabs-window-item>
                </v-tabs-window>
            </v-container>
        </v-main>
    </v-app>
</template>
