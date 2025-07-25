<script setup>
    import { ref, computed } from "vue";

    const props = defineProps({
        label: String,
        icon: String,
        field: Object,
        disabled: Boolean
    });
</script>

<template>
    <div class="isdl-html flexcol">
        <label style="font-weight: bold"><span v-if="icon"><i :class="icon"></i> </span>{{ game.i18n.localize(label) }}</label>
        <div class="prose-mirror-wrapper" v-html="disabled ? field.enriched : field.element.outerHTML"></div>
    </div>
</template>
