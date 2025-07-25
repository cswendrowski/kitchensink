<script setup>
    import { ref, computed, inject } from "vue";
    import DataTable from 'datatables.net-vue3';
    import DataTablesCore from 'datatables.net-dt';
    import 'datatables.net-responsive-dt';
    import 'datatables.net-colreorder-dt';
    import 'datatables.net-rowreorder-dt';
    import 'datatables.net-buttons-dt';
    import ColVis from "datatables.net-buttons/js/buttons.colVis";

    DataTable.use(DataTablesCore);
    DataTable.use(ColVis);

    const props = defineProps({
        systemPath: String,
        context: Object
    });
    const document = inject('rawDocument');

    const data = computed(() => {
        const systemPath = props.systemPath ?? inject('systemPath');;
        console.log("Getting data for datatable", systemPath, props.context);
        return foundry.utils.getProperty(props.context, systemPath);
    });

    const humanize = (str) => {
        let humanized = str.replace(/_/g, " ");
        humanized = humanized.replace("system.", "").replaceAll(".", " ");
        humanized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
        return humanized;
    };

    const editItem = (rowData) => {
        const item = document.items.get(rowData._id);
        item.sheet.render(true);
    };

    const sendItemToChat = async (rowData) => {
        const item = document.items.get(rowData._id);
        const chatDescription = item.description ?? item.system.description;
        const content = await renderTemplate("systems/kitchen-sink/system/templates/chat/standard-card.hbs", { 
            cssClass: "kitchen-sink",
            document: item,
            hasEffects: item.effects?.size > 0,
            description: chatDescription,
            hasDescription: chatDescription != ""
        });
        ChatMessage.create({
            content: content,
            speaker: ChatMessage.getSpeaker(),
            style: CONST.CHAT_MESSAGE_STYLES.IC
        });
    };

    const deleteItem = async (rowData) => {
        const item = document.items.get(rowData._id);
        const shouldDelete = await Dialog.confirm({
            title: "Delete Confirmation",
            content: `<p>Are you sure you would like to delete the "${item.name}" Item?</p>`,
            defaultYes: false
        });
        if ( shouldDelete ) item.delete();
    };

    const customItemAction = async (rowData, event) => {
        const item = document.items.get(rowData._id);
        item.sheet._onAction(event);
    };

    function bindDragDrop() {
        try {
            if (document.sheet.element) {
                document.sheet.dragDrop.forEach((d) => d.bind(document.sheet.element));
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    
    function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const columns = [
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
                    const description = escapeHtml(context.system?.description || "");
                    return `<span data-tooltip='${description}'>${data}</span>`;
                }
                return data;
            }
        },
        { data: 'system.type', title: game.i18n.localize("Equipment.Type.label") },
        { data: 'system.bonus', title: game.i18n.localize("Equipment.Bonus"), type: 'num' },
        { data: 'system.parentattribute', title: game.i18n.localize("Equipment.ParentAttribute"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentresource', title: game.i18n.localize("Equipment.ParentResource"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentnumber', title: game.i18n.localize("Equipment.ParentNumber"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentboolean', title: game.i18n.localize("Equipment.ParentBoolean"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentdate', title: game.i18n.localize("Equipment.ParentDate"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parenttime', title: game.i18n.localize("Equipment.ParentTime"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentdatetime', title: game.i18n.localize("Equipment.ParentDateTime"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentdie', title: game.i18n.localize("Equipment.ParentDie"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentstring', title: game.i18n.localize("Equipment.ParentString"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parenttracker', title: game.i18n.localize("Equipment.ParentTracker"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentchoice', title: game.i18n.localize("Equipment.ParentChoice"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parentpaperdoll', title: game.i18n.localize("Equipment.ParentPaperdoll"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { data: 'system.parenthtml', title: game.i18n.localize("Equipment.ParentHtml"), render: (data, type, context) => {
                return humanize(data);
            }
        },
        { 
            data: null,
            title: game.i18n.localize("Actions"),
            render: '#actions',
            responsivePriority: 1,
            orderable: false,
            width: '200px'
        }
    ];

    const options = {
        paging: false,
        stateSave: true,
        responsive: true,
        colReorder: false,
        order: [[1, 'asc']],
        createdRow: (row, data) => {
            //row.setAttribute('data-tooltip', data.description);
            row.setAttribute("data-id", data._id);
            row.setAttribute("data-uuid", data.uuid);
            row.setAttribute("data-type", data.type);
        },
        initComplete: (settings, json) => {
            bindDragDrop();
        },
        layout: {
            topStart: {
                buttons: [
                    {
                        text: '<i class="fas fa-plus"></i> Add',
                        action: (e, dt, node, config) => {
                            const type = 'equipment';
                            Item.createDocuments([{type: type, name: "New " + type}], {parent: document}).then(item => {
                                item[0].sheet.render(true);
                            });
                        }
                    },
                    'colvis'
                ]
            }
        }
    };
</script>

<template>
    <DataTable class="display compact" :data="data" :columns="columns" :options="options" @draw="bindDragDrop">
        <template #image="props">
            <img :src="props.cellData" width=40 height=40 />
        </template>
        <template #actions="props">
            <div class="flexrow">
                <a class="row-action" data-action="edit" @click="editItem(props.rowData)" :data-tooltip="game.i18n.localize('Edit')"><i class="fas fa-edit"></i></a>
                <a class="row-action" data-action="sendToChat" @click="sendItemToChat(props.rowData)" :data-tooltip="game.i18n.localize('SendToChat')"><i class="fas fa-message"></i></a>
                <a class="row-action" data-action="delete" @click="deleteItem(props.rowData)" :data-tooltip="game.i18n.localize('Delete')"><i class="fas fa-delete-left"></i></a>
            </div>
        </template>
    </DataTable>
</template>

<style>
    @import 'datatables.net-dt';
    @import 'datatables.net-responsive-dt';
    @import 'datatables.net-rowreorder-dt';
    @import 'datatables.net-colreorder-dt';
    @import 'datatables.net-buttons-dt';
</style>
