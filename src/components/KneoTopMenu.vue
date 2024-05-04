<template>
  <n-layout-header :inverted="inverted" bordered>
  <n-grid x-gap="12" :cols="1">
    <n-gi>
      <n-menu mode="horizontal" :expanded-keys="expandedKeys" :inverted="inverted" :options="menuOptions"/>
    </n-gi>
  </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import {
  EuroOutlined,
  ProjectOutlined,
  PushpinOutlined,
  RobotOutlined
} from "@vicons/antd";
import {Component, defineComponent, h, ref} from "vue";
import {NGrid, NGi, NIcon, NMenu, NLayoutHeader} from "naive-ui";

export default defineComponent({
  components: {
    NLayoutHeader,
    NGrid,
    NGi,
    NIcon,
    NMenu
  },
  setup() {
    const menuOptions = [
      {
        label: 'Projects and tasks',
        key: 'projects-and-tasks',
        icon: renderIcon(ProjectOutlined)
      },
      {
        label: 'Debts',
        key: 'debts',
        icon: renderIcon(EuroOutlined),
        disabled: true,
        children: [
          {
            label: 'Rat',
            key: 'rat'
          }
        ]
      },
      {
        label: 'Wishes',
        key: 'wishes',
        disabled: true,
        icon: renderIcon(PushpinOutlined)
      },
      {
        label: 'Assistant bot',
        key: 'assistant-bot',
        icon: renderIcon(RobotOutlined)
      }
    ]

    function renderIcon(icon: Component) {
      return () => h(NIcon, null, {default: () => h(icon)})
    }

    return {
      menuOptions,
      inverted: ref(false),
      expandedKeys: ref(['projects'])
    }
  }
});
</script>


<style scoped>

</style>