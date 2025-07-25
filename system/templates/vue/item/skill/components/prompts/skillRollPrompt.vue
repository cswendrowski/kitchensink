<script setup>
    import { ref, inject, computed } from "vue";

    const props = defineProps({
        context: Object,
        primaryColor: String,
        secondaryColor: String,
    });

    const editMode = true;
</script>
<template>
    <v-app>
        <v-main class="d-flex">
            <v-container class="topography" fluid style="padding: 1rem; height: 100%;">
                <v-number-input
                    controlVariant="stacked"
                    density="compact"
                    variant="outlined"
                    v-model="context.system.rollanswer.bonus"
                    
                    name="system.rollanswer.bonus"
                    :label="game.i18n.localize('Skill.Bonus')"
                    :disabled="!editMode || false"
                >
                
            <template #append-inner>
                <i-calculator v-if="editMode" :context="context" :systemPath="'system.rollanswer.bonus'" :primaryColor="primaryColor" :secondaryColor="secondaryColor"></i-calculator>
            </template>
            
                </v-number-input>
                <v-checkbox v-model="context.system.rollanswer.hasadvantage" name="system.rollanswer.hasadvantage" :label="game.i18n.localize('Skill.HasAdvantage')" :disabled="!editMode || false" :color="primaryColor"></v-checkbox>
                <v-row class="flexrow">
                    <v-btn @click="console.log('Clicked Roll')" color="primary" class="ma-1 action-btn">Submit</v-btn>
                    <v-btn @click="console.log('Clicked Roll')" color="error" class="ma-1 action-btn">Cancel</v-btn>
                </v-row>
            </v-container>                
        </v-main>
    </v-app>
</template>
