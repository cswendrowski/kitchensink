<script setup>
    import { ref, watch, inject, computed, watchEffect } from "vue";
    import skillRollAction from './components/actions/skillRollAction.vue';
    import skillSimpleFightRollAction from './components/actions/skillSimpleFightRollAction.vue';
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
        page: 'skill',
        tab: 'description'
    };

    const drawer = ref(false);
    const page = ref(lastState.page);
    const tab = ref(lastState.tab);
    const pageDefaultTabs = {
        'skill': 'description',
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
        'skill': 'topography',
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
            const tableName = `itemSkill${pageName}${tabName}`;
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
        'ability': computed(() => {
            return 'default';
        })
        ,
        'trained': computed(() => {
            return 'default';
        })
        ,
        'skillmod': computed(() => {
            return 'default';
        })
        ,
        'usesleft': computed(() => {
            return 'default';
        })
        ,
        'die': computed(() => {
            return 'default';
        })
        ,
        'template': computed(() => {
            return 'default';
        })
        ,
        'skill': computed(() => {
            return 'readonly';
        })
        ,
        'roll': computed(() => {
            return 'default';
        })
        ,
        'simplefightroll': computed(() => {
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
                <v-tab value="skill" prepend-icon="fa-solid fa-circle-user">Skill</v-tab>
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
                    <v-tabs-window-item value="skill" data-tab="skill">
                        <v-row dense>
                            <v-select 
                                name="system.ability" 
                                v-model="context.system.ability" 
                                :items="[{ label: 'Hero - AttributeField', value: 'system.attributefield' }, { label: 'Hero - Fight', value: 'system.fight' }, { label: 'Hero - Flight', value: 'system.flight' }, { label: 'Hero - Endure', value: 'system.endure' }, { label: 'Hero - Persuade', value: 'system.persuade' }, { label: 'Hero - Grit', value: 'system.grit' }]" 
                                item-title="label" 
                                item-value="value" 
                                :disabled="isDisabled('ability')" v-if="!isHidden('ability')" 
                                variant="outlined" 
                                class="double-wide"
                                density="compact">
                                    <template #label>
                                        <span v-html="getLabel('Skill.Ability', )" />
                                    </template>
                            </v-select>
                            <v-checkbox
                                v-model="context.system.trained"
                                name="system.trained"
                                :disabled="isDisabled('trained')" v-if="!isHidden('trained')"
                                :color="primaryColor">
                                
                <template #label>
                    <span v-html="getLabel('Skill.Trained', undefined)" />
                </template>
                            </v-checkbox>
                            <v-number-input
                                controlVariant="stacked"
                                density="compact"
                                variant="outlined"
                                v-model="context.system.skillmod"
                                name="system.skillmod"
                                :disabled="isDisabled('skillmod')" v-if="!isHidden('skillmod')"
                            >
                            
                <template #label>
                    <span v-html="getLabel('Skill.SkillMod', undefined)" />
                </template>
                            
                <template #append-inner>
                    <i-calculator v-if="editMode" :context="context" :systemPath="'system.skillmod'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
                </template>
                
                            </v-number-input>
                            <i-tracker 
                                label="Skill.UsesLeft"
                                systemPath="system.usesleft" :context="context" 
                                :visibility="visibilityStates['usesleft'].value"
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
                            <v-select 
                                name="system.die" 
                                v-model="context.system.die" 
                                :items="[ 'd4', 'd6', 'd8', 'd10', 'd12', 'd20' ]" 
                                :disabled="isDisabled('die')" v-if="!isHidden('die')" 
                                variant="outlined" 
                                density="compact">
                                <template #label>
                                    <span v-html="getLabel('Skill.Die', )" />
                                </template>
                                <template #prepend-inner>
                                    <i :class="'fa-solid fa-dice-' + context.system.die"></i>
                                </template>
                            </v-select>
                            <i-measured-template
                                :context="context"
                                label="Skill.Template"
                                icon=""
                                systemPath="system.template"
                                :primaryColor="primaryColor"
                                :secondaryColor="secondaryColor"
                                :disabled="isDisabled('template')" v-if="!isHidden('template')">
                            </i-measured-template>
                            <v-number-input
                                controlVariant="stacked"
                                density="compact"
                                variant="outlined"
                                 append-inner-icon="fa-solid fa-function" control-variant="hidden" class="calculated-number" :model-value="context.system.skill"
                                name="system.skill"
                                :disabled="isDisabled('skill')" v-if="!isHidden('skill')"
                            >
                            
                <template #label>
                    <span v-html="getLabel('Skill.Skill', undefined)" />
                </template>

                            </v-number-input>
                            <skillRollAction 
                                :context="context" 
                                :color="primaryColor"
                                :editMode="editMode" 
                                :visibility="visibilityStates['roll'].value">
                            </skillRollAction>
                            <skillSimpleFightRollAction 
                                :context="context" 
                                :color="primaryColor"
                                :editMode="editMode" 
                                :visibility="visibilityStates['simplefightroll'].value">
                            </skillSimpleFightRollAction>
                        </v-row>
                        <v-divider class="mt-4 mb-2"></v-divider>
                        <v-tabs v-model="tab" grow always-center>
                                <v-tab value="description" prepend-icon="fa-solid fa-book">Description</v-tab>
                                <v-tab value="effects" prepend-icon="fa-solid fa-sparkles" @mousedown="spawnDatatableWindow($event, 'Skill', 'effects')">Effects</v-tab>
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
                </v-tabs-window>
            </v-container>
        </v-main>
    </v-app>
</template>
