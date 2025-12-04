import { Component, ComponentPublicInstance, DefineComponent } from 'vue';

declare module '*.vue' {
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        $renderIcon(icon: Component): ComponentPublicInstance;
    }
}
