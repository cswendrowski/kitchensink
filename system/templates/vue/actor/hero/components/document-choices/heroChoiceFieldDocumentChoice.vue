<script setup>
    import { ref, inject, computed } from "vue";

    const props = defineProps({
        context: Object,
        editMode: Boolean,
        primaryColor: String,
        secondaryColor: String
    });

    const document = inject('rawDocument');
    const unlocked = false;

    const value = ref(foundry.utils.getProperty(document, 'system.choicefield'));
    const onChange = (value) => {
        document.update({ 'system.choicefield': value });
        const updated = fromUuidSync(value);
        if (updated) selectedImage.value = updated.img;
    };

    const selectedImage = ref(value.value?.img);

    const disabled = computed(() => {
        let item = value.value?.length > 0 ? value.value[0] : value.value;
        let system = props.context.system;
        return false || (!props.editMode && !unlocked);
    });

    const hidden = computed(() => {
        let item = value.value?.length > 0 ? value.value[0] : value.value;
        let system = props.context.system;
        return false
    });

    const choices = computed(() => {
        let system = props.context.system;
        let allChoices = Array.from(document.items);

        

        allChoices = allChoices.filter(item => {
            if (item.type !== 'skill') return false;
            return true
        });

        if (allChoices.length === 0) return [{
            id: null,
            name: 'No choices available'
        }];

        return allChoices.map(choice => {
            let context = {
                id: choice.uuid,
                name: choice.name,
                image: choice.img,
                summary: truncate(choice.system.description, 50),
                description: choice.system.description
            };

            if (choice.parent) {
                context.source = "Self";
                context.color = props.primaryColor;
                context.icon = 'fa-solid fa-user';
            }
            else if (choice.compendium) {
                context.source = `${choice.compendium.metadata.packageName} - ${choice.compendium.title}`;
                context.color = props.secondaryColor;
                context.icon = 'fa-solid fa-suitcase';
            }
            else {
                context.source = "World";
                context.color = props.secondaryColor;
                context.icon = 'fa-solid fa-globe';
            }

            return context;
        });
    });

    const truncate = (text, maxLength) => {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    const getLabel = (label, icon) => {
        const localized = game.i18n.localize(label);
        if (icon) {
            return `<i class="${icon}"></i> ${localized}`;
        }
        return localized;
    }
</script>
<template>
    <v-autocomplete clearable dense 
        v-model="value" 
        @update:modelValue="onChange"
        :items="choices" 
        item-title="name" 
        item-value="id" 
        density="compact"
        variant="outlined"
        :disabled="disabled"
        class="double-wide"
    >
        <template #label>
            <span v-html="getLabel('Hero.ChoiceField', )" />
        </template>
        <template v-slot:prepend-inner v-if="value">
            <v-avatar rounded="0" :image="selectedImage" size="30"</v-avatar>
        </template>
        <template v-slot:item="{ props, item }">
            <v-list-item
                v-bind="props"
                :data-tooltip="item.raw.description"
            >
                <template v-slot:title>
                    <div class="flexrow">
                        <p style="flex: 1">{{ item.raw.name }}</p>
                        <v-spacer />
                        <v-chip size="small" label :color="item.raw.color" style="align-self: center; white-space: nowrap; flex: 0; line-height: 26px; display: inline-table;"><v-icon :icon="item.raw.icon" start></v-icon> {{ item.raw.source }}</v-chip>
                    </div>
                </template>
                <template v-if="item.raw.image" v-slot:prepend>
                    <v-avatar rounded="0" :image="item.raw.image">
                    </v-avatar>
                </template>
                <template v-slot:subtitle>
                    <div v-html="item.raw.summary"></div>
                </template>
            </v-list-item>
        </template>
    </v-autocomplete>
</template>
