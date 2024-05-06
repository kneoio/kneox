<template>
  <n-layout has-sider>
    <n-layout-sider
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :native-scrollbar="false"
        :inverted="inverted"
    >
      <n-menu
          :inverted="inverted"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          @update:value="handleNavigation"
      />
    </n-layout-sider>
    <n-layout class="layout-content-expand">
      <router-view/>
    </n-layout>
  </n-layout>
</template>

<script lang="ts">
import { defineComponent, ref, h } from "vue";
import { useRouter } from 'vue-router';
import { NLayout, NLayoutSider, NMenu } from "naive-ui";
import {ProjectOutlined} from "@vicons/antd";

export default defineComponent({
  components: { NLayout, NLayoutSider, NMenu },
  setup() {
    const router = useRouter();
    const inverted = ref(false);

    const menuOptions = [
      {
        label: 'KickNeo',
        key: '/ai/kickneo',
        icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        action: () => router.push('/ai/kickneo')
      },
      {
        label: 'ChatGPT',
        key: '/ai/gpt',
        icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        action: () => router.push('/ai/gpt')
      }
    ];

    const handleNavigation = (key: string) => {
      router.push(key);
    };

    return {
      menuOptions,
      inverted,
      handleNavigation
    }
  }
})
</script>

<style scoped>
.layout-content-expand {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Ensures it fills the space not occupied by the sider */
}
</style>
