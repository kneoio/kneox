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
  CoffeeOutlined,
  EuroOutlined,
  ProjectOutlined,
  PushpinOutlined,
  RobotOutlined,
  UserOutlined,
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
        icon: renderIcon(RobotOutlined),
        children: [
          {
            type: 'group',
            label: 'People',
            key: 'people',
            children: [
              {
                label: 'Narrator',
                key: 'narrator',
                icon: renderIcon(UserOutlined)
              },
              {
                label: 'Sheep Man',
                key: 'sheep-man',
                icon: renderIcon(UserOutlined)
              }
            ]
          },
          {
            label: 'Beverage',
            key: 'beverage',
            icon: renderIcon(CoffeeOutlined),
            children: [
              {
                label: 'Whisky',
                key: 'whisky'
              }
            ]
          },
          {
            label: 'Food',
            key: 'food',
            children: [
              {
                label: 'Sandwich',
                key: 'sandwich'
              }
            ]
          },
          {
            label: 'The past increases. The future recedes.',
            key: 'the-past-increases-the-future-recedes'
          }
        ]
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