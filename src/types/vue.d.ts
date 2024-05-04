import {Component, ComponentPublicInstance} from 'vue';

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        $renderIcon(icon: Component): ComponentPublicInstance;
    }
}
