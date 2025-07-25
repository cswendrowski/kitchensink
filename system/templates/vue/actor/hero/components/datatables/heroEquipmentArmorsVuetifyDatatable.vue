<script setup>
    import { ref, computed, inject, onMounted, watch } from "vue";

    const props = defineProps({
        systemPath: String,
        context: Object,
        primaryColor: String,
        secondaryColor: String,
        tertiaryColor: String
    });
    
    const document = inject('rawDocument');
    const search = ref('');
    const loading = ref(false);
    const showColumnDialog = ref(false);
    
    const columnVisibility = ref({});
    const columnOrder = ref([]);

    const data = computed(() => {
        const systemPath = props.systemPath ?? inject('systemPath');
        const systemData = foundry.utils.getProperty(props.context, systemPath) || [];
        return systemData;
    });
    
    const customHeaders = [
        { title: game.i18n.localize("Equipment.Type.label"), key: 'system.type', sortable: true },
        { title: game.i18n.localize("Equipment.Bonus"), key: 'system.bonus', sortable: true },
        { title: game.i18n.localize("Equipment.ParentAttribute"), key: 'system.parentattribute', sortable: true },
        { title: game.i18n.localize("Equipment.ParentResource"), key: 'system.parentresource', sortable: true },
        { title: game.i18n.localize("Equipment.ParentNumber"), key: 'system.parentnumber', sortable: true },
        { title: game.i18n.localize("Equipment.ParentBoolean"), key: 'system.parentboolean', sortable: true },
        { title: game.i18n.localize("Equipment.ParentDate"), key: 'system.parentdate', sortable: true },
        { title: game.i18n.localize("Equipment.ParentTime"), key: 'system.parenttime', sortable: true },
        { title: game.i18n.localize("Equipment.ParentDateTime"), key: 'system.parentdatetime', sortable: true },
        { title: game.i18n.localize("Equipment.ParentDie"), key: 'system.parentdie', sortable: true },
        { title: game.i18n.localize("Equipment.ParentString"), key: 'system.parentstring', sortable: true },
        { title: game.i18n.localize("Equipment.ParentTracker"), key: 'system.parenttracker', sortable: true },
        { title: game.i18n.localize("Equipment.ParentChoice"), key: 'system.parentchoice', sortable: true },
        { title: game.i18n.localize("Equipment.ParentPaperdoll"), key: 'system.parentpaperdoll', sortable: true },
        { title: game.i18n.localize("Equipment.ParentHtml"), key: 'system.parenthtml', sortable: true },
    ];

    const orderedHeaders = computed(() => {
        if (columnOrder.value.length === 0) {
            return customHeaders;
        }
        
        // Create a map for quick lookup
        const headerMap = new Map();
        customHeaders.forEach(header => {
            headerMap.set(header.key, header);
        });
        
        // Build ordered array based on columnOrder, then add any missing headers
        const ordered = [];
        columnOrder.value.forEach(key => {
            if (headerMap.has(key)) {
                ordered.push(headerMap.get(key));
                headerMap.delete(key);
            }
        });
        
        // Add any remaining headers that weren't in the order
        headerMap.forEach(header => {
            ordered.push(header);
        });
        
        return ordered;
    });

    const visibleHeaders = computed(() => {
        const baseHeaders = [
            { 
                title: game.i18n.localize("Image"), 
                key: 'img', 
                sortable: false,
                width: '30px'
            },
            { 
                title: game.i18n.localize("Name"), 
                key: 'name', 
                sortable: true,
                width: '100px'
            }
        ];
        
        let customHeadersToShow = orderedHeaders.value.filter(header => header && isColumnVisible(header.key));
        
        const actionHeaders = [
            { 
                title: game.i18n.localize("Actions"), 
                key: 'actions', 
                sortable: false,
                width: '200px',
                align: 'center'
            }
        ];
        
        return [...baseHeaders, ...customHeadersToShow, ...actionHeaders];
    });
    
    // Column configuration
    const settingKey = 'documentTableColumns';
    
    const defaultVisibileColumns = [
        'system.type',
        'system.bonus',
        'system.parentattribute',
        'system.parentresource',
        'system.parentnumber',
        'system.parentboolean',
        'system.parentdate',
        'system.parenttime',
        'system.parentdatetime',
        'system.parentdie',
        'system.parentstring',
        'system.parenttracker',
        'system.parentchoice',
        'system.parentpaperdoll',
        'system.parenthtml'
    ];

    const initializeColumnSettings = async () => {
        try {
            const savedSettings = game.settings.get("kitchen-sink", settingKey) || {};
            const documentTables = savedSettings[document._id] || {};
            const tableSettings = documentTables['EquipmentArmors'] || {};
            
            // Initialize visibility with defaults if no saved settings
            const defaultVisibility = {};
            customHeaders.forEach(col => {
                if (defaultVisibileColumns.includes(col.key)) {
                    defaultVisibility[col.key] = true;
                } else {
                    defaultVisibility[col.key] = false;
                }
                if (tableSettings.visibility && tableSettings.visibility[col.key] !== undefined) {
                    defaultVisibility[col.key] = tableSettings.visibility[col.key];
                }
            });
            
            columnVisibility.value = defaultVisibility;
            
            // Initialize order
            if (tableSettings.order && Array.isArray(tableSettings.order)) {
                columnOrder.value = [...tableSettings.order];
            } else {
                // Default order is the order they appear in customHeaders
                columnOrder.value = customHeaders.map(h => h.key);
            }
        } catch (error) {
            console.warn("Failed to load column settings, using defaults:", error);
            // Use defaults if setting doesn't exist yet
            const defaultVisibility = {};
            customHeaders.forEach(col => {
                if (defaultVisibileColumns.includes(col.key)) {
                    defaultVisibility[col.key] = true;
                } else {
                    defaultVisibility[col.key] = false;
                }
            });
            columnVisibility.value = defaultVisibility;
            columnOrder.value = customHeaders.map(h => h.key);
        }
    };

    const saveColumnSettings = async () => {
        try {
            const savedSettings = game.settings.get("kitchen-sink", settingKey) || {};
            const documentTables = savedSettings[document._id] || {};
            savedSettings[document._id] = documentTables;
            
            const tableSettings = documentTables['EquipmentArmors'] || {};
            
            // Save visibility
            const visibilitySettings = {};
            customHeaders.forEach(col => {
                visibilitySettings[col.key] = columnVisibility.value[col.key];
            });
            
            tableSettings.visibility = visibilitySettings;
            tableSettings.order = [...columnOrder.value];
            
            savedSettings[document._id]['EquipmentArmors'] = tableSettings;
            await game.settings.set("kitchen-sink", settingKey, savedSettings);
        } catch (error) {
            console.error("Failed to save column settings:", error);
            ui.notifications.error("Failed to save column settings");
        }
    };

    const isColumnVisible = (columnKey) => {
        return columnVisibility.value[columnKey] !== false;
    };

    const toggleColumn = async (columnKey) => {
        columnVisibility.value[columnKey] = !columnVisibility.value[columnKey];
        await saveColumnSettings();
    };

    const resetColumns = async () => {
        const defaultVisibility = {};
        customHeaders.forEach(col => {
            if (defaultVisibileColumns.includes(col.key)) {
                defaultVisibility[col.key] = true;
            } else {
                defaultVisibility[col.key] = false;
            }
        });
        columnVisibility.value = defaultVisibility;
        columnOrder.value = customHeaders.map(h => h.key);
        await saveColumnSettings();
    };

    const moveColumn = async (fromIndex, toIndex) => {
        const newOrder = [...columnOrder.value];
        const [movedItem] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, movedItem);
        columnOrder.value = newOrder;
        await saveColumnSettings();
    };

    const onDragStart = (event, index) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', index.toString());
    };

    const onDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = async (event, toIndex) => {
        event.preventDefault();
        const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
        if (fromIndex !== toIndex) {
            await moveColumn(fromIndex, toIndex);
        }
    };

    onMounted(() => {
        initializeColumnSettings();
    });

    const humanize = (str) => {
        if (!str) return "";
        let humanized = str.replace(/_/g, " ");
        humanized = humanized.replace("system.", "").replaceAll(".", " ");
        humanized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
        return humanized;
    };

    const getNestedValue = (obj, path) => {
        const data = foundry.utils.getProperty(obj, path);
        return data;
    };

    const getResourceColor = (resource) => {
        if (!resource || !resource.max) return 'grey';
        const percentage = (resource.value / resource.max) * 100;
        if (percentage > 75) return 'green';
        if (percentage > 50) return 'orange';
        if (percentage > 25) return 'red';
        return 'red-darken-2';
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        return new Date(dateValue).toLocaleDateString();
    };

    const editItem = (item) => {
        const foundryItem = document.items.get(item._id);
        foundryItem.sheet.render(true);
    };

    const sendItemToChat = async (item) => {
        const foundryItem = document.items.get(item._id);
        const chatDescription = foundryItem.description ?? foundryItem.system.description;
        const content = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", { 
            cssClass: "kitchen-sink",
            document: foundryItem,
            hasEffects: foundryItem.effects?.size > 0,
            description: chatDescription,
            hasDescription: chatDescription != ""
        });
        ChatMessage.create({
            content: content,
            speaker: ChatMessage.getSpeaker(),
            style: CONST.CHAT_MESSAGE_STYLES.IC
        });
    };

    const deleteItem = async (item) => {
        const foundryItem = document.items.get(item._id);
        const shouldDelete = await Dialog.confirm({
            title: "Delete Confirmation",
            content: `<p>Are you sure you would like to delete the "${foundryItem.name}" Item?</p>`,
            defaultYes: false
        });
        if (shouldDelete) foundryItem.delete();
    };

    const customItemAction = async (item, actionName) => {
        const foundryItem = document.items.get(item._id);
        const event = { currentTarget: { dataset: { action: actionName } } };
        foundryItem.sheet._onAction(event);
    };

    const addNewItem = async () => {
        loading.value = true;
        try {
            const type = 'equipment';
            const items = await Item.createDocuments([{
                type: type, 
                name: "New " + type
            }], {parent: document});
            
            if (items && items[0]) {
                items[0].sheet.render(true);
            }
        } catch (error) {
            console.error("Error creating item:", error);
            ui.notifications.error("Failed to create new item");
        } finally {
            loading.value = false;
        }
    };
    
    const truncate = (text, maxLength) => {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    const bindDragDrop = () => {
        try {
            if (document.sheet.element) {
                document.sheet.dragDrop.forEach((d) => d.bind(document.sheet.element));
            }
        } catch (e) {
            console.error(e);
        }
    };
    
    const getExtendedChoiceTooltip = (item, systemPath) => {
        const tooltipParts = [];
        const coreKeys = ['value', 'color', 'icon'];
        const base = getNestedValue(item, systemPath);
        for (const key of Object.keys(base)) {
            if (!coreKeys.includes(key)) {
                const value = base[key];
                if (value !== undefined) {
                    tooltipParts.push(`${key}: ${value}`);
                }
            }
        }
        return tooltipParts.join('<br>');
    };

    // Bind drag drop after component mount
    setTimeout(() => bindDragDrop(), 100);
</script>

<template>
    <v-card flat class="isdl-datatable">
        <v-card-title class="d-flex align-center pe-1" style="height: 40px;">
            <v-icon icon="fa-solid fa-table" size="small" />
            &nbsp; {{ game.i18n.localize("Hero.Armors") }}
            <v-spacer></v-spacer>
            <v-text-field
                    v-model="search"
                    density="compact"
                    label="Search"
                    prepend-inner-icon="fa-solid fa-magnify"
                    variant="outlined"
                    flat
                    hide-details
                    single-line
                    clearable
                    style="margin: 0; margin-right: 8px;"
            ></v-text-field>
            <v-btn
                icon="fa-solid fa-columns"
                size="small"
                variant="text"
                @click="showColumnDialog = true"
                style="margin-right: 8px;"
            >
                <v-icon>fa-solid fa-columns</v-icon>
                <v-tooltip activator="parent" location="top">Configure Columns</v-tooltip>
            </v-btn>
            <v-btn
                :color="primaryColor || 'primary'"
                prepend-icon="fa-solid fa-plus"
                rounded="0"
                size="small"
                :loading="loading"
                @click="addNewItem"
                style="max-width: 80px; height: 38px;"
            >
                {{ game.i18n.localize("Add") }}
            </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        
        <v-data-table
            v-model:search="search"
            :headers="visibleHeaders"
            :items="data"
            :search="search"
            hover
            density="compact"
            hide-default-footer
            style="background: none;"
        >
            <!-- Image slot -->
            <template v-slot:item.img="{ item }">
                <v-avatar size="40" rounded="0">
                    <v-img :src="item.img" :alt="item.name" cover></v-img>
                </v-avatar>
            </template>

            <!-- Name slot with description tooltip -->
            <template v-slot:item.name="{ item }">
                <div class="d-flex align-center" :data-tooltip="item.system.description">
                    <div class="font-weight-medium" style="width: 100px;">{{ item.name }}</div>
                </div>
            </template>

            <!-- Custom field slots -->
            <template v-if="isColumnVisible('system.type')" v-slot:item.system.type="{ item }">
                <v-chip label size="x-small" variant="elevated" class="text-caption">
                    {{ getNestedValue(item, 'system.type') }}
                </v-chip>
            </template>
            <template v-if="isColumnVisible('system.parentattribute')" v-slot:item.system.parentattribute="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentattribute')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentresource')" v-slot:item.system.parentresource="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentresource')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentnumber')" v-slot:item.system.parentnumber="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentnumber')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentboolean')" v-slot:item.system.parentboolean="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentboolean')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentdate')" v-slot:item.system.parentdate="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentdate')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parenttime')" v-slot:item.system.parenttime="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parenttime')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentdatetime')" v-slot:item.system.parentdatetime="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentdatetime')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentdie')" v-slot:item.system.parentdie="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentdie')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentstring')" v-slot:item.system.parentstring="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentstring')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parenttracker')" v-slot:item.system.parenttracker="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parenttracker')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentchoice')" v-slot:item.system.parentchoice="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentchoice')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parentpaperdoll')" v-slot:item.system.parentpaperdoll="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parentpaperdoll')) }}</span>
            </template>
            <template v-if="isColumnVisible('system.parenthtml')" v-slot:item.system.parenthtml="{ item }">
                <span class="text-caption">{{ humanize(getNestedValue(item, 'system.parenthtml')) }}</span>
            </template>

            <!-- Actions slot -->
            <template v-slot:item.actions="{ item }">
                <div class="d-flex align-center justify-center ga-1">
                    <v-tooltip text="Edit">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon="fa-solid fa-edit"
                                size="x-small"
                                variant="text"
                                @click="editItem(item)"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                    <v-tooltip text="Send to Chat">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon="fa-solid fa-message"
                                size="x-small"
                                variant="text"
                                @click="sendItemToChat(item)"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                    <v-tooltip text="Delete">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon="fa-solid fa-trash"
                                size="x-small"
                                variant="text"
                                color="error"
                                @click="deleteItem(item)"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                </div>
            </template>

            <!-- No data slot -->
            <template v-slot:no-data>
                <div class="text-center pa-4">
                    <v-icon size="48" color="grey-lighten-1">fa-solid fa-inbox</v-icon>
                    <div class="text-h6 mt-2">No items found</div>
                    <div class="text-body-2 text-medium-emphasis">
                        Add your first {{ game.i18n.localize("Equipment").toLowerCase() }} to get started
                    </div>
                </div>
            </template>
        </v-data-table>
    </v-card>

    <!-- Column Configuration Dialog -->
    <v-dialog v-model="showColumnDialog" max-width="600px">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2">fa-solid fa-columns</v-icon>
                Configure Columns
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <div class="text-body-2 mb-4 text-medium-emphasis">
                    Drag to reorder columns, check/uncheck to show/hide columns
                </div>
                <v-list density="compact" class="column-config-list">
                    <div 
                        v-for="(columnKey, index) in columnOrder" 
                        :key="columnKey"
                        class="column-config-item"
                        draggable="true"
                        @dragstart="onDragStart($event, index)"
                        @dragover="onDragOver"
                        @drop="onDrop($event, index)"
                    >
                        <v-list-item class="px-2">
                            <template v-slot:prepend>
                                <v-icon 
                                    icon="fa-solid fa-grip-vertical" 
                                    class="drag-handle me-2" 
                                    size="small"
                                    style="cursor: grab;"
                                ></v-icon>
                                <v-checkbox-btn 
                                    :model-value="columnVisibility[columnKey]" 
                                    @update:model-value="toggleColumn(columnKey)"
                                    class="me-2"
                                ></v-checkbox-btn>
                            </template>
                            <v-list-item-title>
                                {{ customHeaders.find(h => h.key === columnKey)?.title || columnKey }}
                            </v-list-item-title>
                        </v-list-item>
                    </div>
                </v-list>
            </v-card-text>
            <v-card-actions class="flexrow">
                <v-btn
                    variant="elevated"
                    @click="showColumnDialog = false"
                    :color="primaryColor"
                >
                    Close
                </v-btn>
                <v-btn
                    variant="elevated"
                    @click="resetColumns"
                    prepend-icon="fa-solid fa-undo"
                    :color="secondaryColor"
                >
                    Reset to Default
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.v-data-table {
    background: transparent;
}

.column-config-list {
    max-height: 400px;
    overflow-y: auto;
}

.column-config-item {
    border: 1px solid transparent;
    border-radius: 4px;
    margin-bottom: 2px;
    transition: all 0.2s ease;
}

.column-config-item:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.05);
    border-color: rgba(var(--v-theme-primary), 0.2);
}

.column-config-item.dragging {
    opacity: 0.5;
    transform: scale(0.98);
}

.drag-handle:hover {
    cursor: grabbing !important;
}
</style>
