<script setup>
    import { inject, computed } from "vue";

    const props = defineProps({
        context: Object,
        color: String,
        editMode: Boolean,
        visibility: String
    });

    const document = inject('rawDocument');

    const onClick = async (e) => {
        document.sheet._onIncrementAction(e, props.context);
    };

    const disabled = computed(() => {
        //console.log("Action Increment disabled computed triggered", props.visibility, props.editMode);
        const disabledStates = ["readonly", "locked"];
        if (disabledStates.includes(props.visibility)) {
            return true;
        }
        if (props.visibility === "gmEdit") {
            const isGm = game.user.isGM;
            const isEditMode = props.editMode;
            return !isGm && !isEditMode;
        }

        if (props.visibility === "unlocked") {
            return false;
        }
        
        // Default to disabled while in editMode
        return props.editMode;
    });

    const hidden = computed(() => {
        //console.log("Action Increment hidden computed triggered", props.visibility, props.editMode);
        if (props.visibility === "hidden") {
            return true;
        }
        if (props.visibility === "gmOnly") {
            return !game.user.isGM;
        }
        if (props.visibility === "secret") {
            const isGm = game.user.isGM;
            const isOwner = document.getUserLevel(game.user) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
            return !isGm && !isOwner;
        }
        if (props.visibility === "edit") {
            return !props.editMode;
        }

        // Default to visible
        return false;
    });
</script>
<template>
    <v-btn :color="color" class="action-btn" @click="onClick" v-if="!hidden" :disabled="disabled"  :data-tooltip="game.i18n.localize('Hero.Increment')">{{game.i18n.localize('Hero.Increment')}}</v-btn>
</template>
