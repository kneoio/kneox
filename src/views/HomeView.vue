<template>
    <n-layout class="layout-full-height">
      <kneo-header/>
      <kneo-top-menu/>
      <n-layout has-sider class="layout-content-expand">
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
              :options="projectMenuOptions"
          />
        </n-layout-sider>
        <n-layout class="layout-content-expand">
          <n-data-table
              :columns="columns"
              :data="data"
              :pagination="pagination"
              :bordered="false"
          />

        </n-layout>
      </n-layout>
      <n-layout-footer :inverted="inverted" bordered>
        <n-grid :x-gap="12" :cols="4">
          <n-gi>
          </n-gi>
          <n-gi :offset="2" style="margin-top: 3px; margin-right: 5px;  width: 10%; justify-self: end;">
            <n-select v-model="selectedLanguage" :options="languageOptions" default-value="en" />
          </n-gi>
        </n-grid>
      </n-layout-footer>
    </n-layout>

</template>

<script lang="ts">
import {h, defineComponent, ref, inject, Component} from 'vue'
import {
  useMessage,
  NSpace,
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutFooter,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NButton,
  NList, NListItem, NSelect, NH1, NH6, NGrid, NGi, DataTableColumns, NDataTable
} from 'naive-ui'
import { UserOutlined,   ProjectOutlined} from '@vicons/antd'
import KneoHeader from "../components/KneoHeader.vue";
import KneoTopMenu from "../components/KneoTopMenu.vue";

function renderIcon(icon: Component) {
  return () => h(NIcon, null, {default: () => h(icon)})
}

const projectMenuOptions = [
  {
    label: 'Projects',
    key: 'projects',
    icon: renderIcon(ProjectOutlined)
  },
  {
    label: 'Tasks',
    key: 'tasks',
    icon: renderIcon(ProjectOutlined),
    children: [
      {
        label: 'By Author',
        key: 'by-author',
        icon: renderIcon(UserOutlined)
      },
      {
        label: 'By project',
        key: 'by-project',
        icon: renderIcon(ProjectOutlined)
      }
    ]
  }
]

const selectedLanguage = ref('en');

const languageOptions = [
  {label: 'English', value: 'en'},
  {label: 'Portuguese', value: 'pt'},
];

export default defineComponent({
  components: {
    KneoTopMenu,
    KneoHeader,
    NLayout,
    NSpace,
    NIcon,
    NLayoutSider,
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NMenu,
    NButton,
    NList,
    NListItem,
    NSelect,
    NDataTable,
    NH1,
    NH6,
    NGrid,
    NGi,
  },
  setup() {
    const userData = inject<any>('userData');
    const message = useMessage();

    type Song = {
      no: number
      title: string
      length: string
    }

    const createColumns = ({
                             play
                           }: {
      play: (row: Song) => void
    }): DataTableColumns<Song> => {
      return [
        {
          title: 'No',
          key: 'no'
        },
        {
          title: 'Title',
          key: 'title'
        },
        {
          title: 'Length',
          key: 'length'
        },
        {
          title: 'Action',
          key: 'actions',
          render (row) {
            return h(
                NButton,
                {
                  strong: true,
                  tertiary: true,
                  size: 'small',
                  onClick: () => play(row)
                },
                { default: () => 'Play' }
            )
          }
        }
      ]
    }

    const data: Song[] = [
      { no: 3, title: 'Wonderwall', length: '4:18' },
      { no: 4, title: "Don't Look Back in Anger", length: '4:48' },
      { no: 12, title: 'Champagne Supernova', length: '7:27' }
    ]

    return {
      userData,
      projectMenuOptions,
      selectedLanguage,
      languageOptions,
      data,
      columns: createColumns({
        play (row: Song) {
          message.info(`Play ${row.title}`)
        }
      }),
      pagination: false as const,
      inverted: ref(false),
    }
  }
})
</script>

<style scoped>
.layout-full-height {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Change to min-height to ensure it at least covers the viewport */
  overflow: hidden; /* Add this if you want to avoid any unwanted overflow */
}

.layout-content-expand {
  flex-grow: 1; /* This will ensure it takes up all available space */
  display: flex;
  flex-direction: column; /* This ensures all child elements are aligned vertically */
}

</style>