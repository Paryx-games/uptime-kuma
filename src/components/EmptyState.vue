<template>
    <div class="carbon-calm" :class="{ 'is-large': large }">
        <img :src="art.src" alt="" />
        <div class="title">{{ title }}</div>
        <div v-if="$slots.default" class="desc"><slot /></div>
        <div v-if="$slots.action" class="action"><slot name="action" /></div>
        <div class="credit">{{ art.credit }}</div>
    </div>
</template>

<script>
import lighthouse from "../assets/carbon/art/lighthouse.webp";
import hourglass from "../assets/carbon/art/hourglass.webp";

// Each empty place has its own engraving; see assets/carbon/art/CREDITS.md
const ART = {
    lighthouse: { src: lighthouse, credit: "Farne Islands lighthouse, British Library, CC0" },
    hourglass: { src: hourglass, credit: "Egg timer, British Library, CC0" },
};

/**
 * What a list or page shows when it has nothing in it yet
 */
export default {
    props: {
        /** Which illustration to show */
        illustration: {
            type: String,
            required: true,
        },
        /** Bigger illustration, for a page's main empty state */
        large: {
            type: Boolean,
            default: false,
        },
        /** One short title in plain words */
        title: {
            type: String,
            required: true,
        },
    },
    computed: {
        art() {
            return ART[this.illustration];
        },
    },
};
</script>
