<template>
    <n-layout class="layout-full-height">
      <n-grid x-gap="12" :cols="4">
      </n-grid>
      <n-layout-header :inverted="inverted" bordered>
        <n-grid x-gap="12" :cols="4">
          <n-gi>
            <n-h1 class="title">&nbsp;&nbsp;Kneox</n-h1>
          </n-gi>
          <n-gi :offset="2">
            <div class="user-info" v-if="userData.profile">
              <n-space justify="end">
              <n-h6>Hello, {{ userData.profile.username }}</n-h6>
              <n-button @click="logout">Logout</n-button>
              </n-space>
            </div>
            <n-button v-else @click="login">Login</n-button>
          </n-gi>
        </n-grid>
        <n-grid x-gap="12" :cols="1">
          <n-gi>
            <n-menu mode="horizontal" :inverted="inverted" :options="menuOptions"/>
          </n-gi>
        </n-grid>
      </n-layout-header>
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
          <!-- Perhaps some default content or placeholders to ensure expansion -->
        </n-layout>
      </n-layout>
      <n-layout-footer :inverted="inverted" bordered>
        <n-grid :x-gap="12" :cols="4">
          <n-gi>
            <n-h6 class="title">Copyright ©</n-h6>
          </n-gi>
          <n-gi :offset="2" style="margin-top: 5px; margin-right: 5px;  width: 10%; justify-self: end;">
            <n-select v-model="selectedLanguage" :options="languageOptions" default-value="en" />
          </n-gi>
        </n-grid>
      </n-layout-footer>

    </n-layout>

</template>

<script lang="ts">
import {h, defineComponent, ref, Component, inject} from 'vue'
import {
  NSpace,
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutFooter,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NButton,
  NList, NListItem, NSelect, NH1, NH6, NGrid, NGi
} from 'naive-ui'
import { UserOutlined,  CoffeeOutlined, ProjectOutlined, EuroOutlined, PushpinOutlined, RobotOutlined } from '@vicons/antd'
import {KeycloakInstance} from "keycloak-js";

function renderIcon(icon: Component) {
  return () => h(NIcon, null, {default: () => h(icon)})
}

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
    NH1,
    NH6,
    NGrid,
    NGi,
  },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
    const userData = inject<any>('userData');

    const login = async () => {
      if (kc) {
        try {
          await kc.login();
        } catch (error) {
          console.error('Login failed', error);
        }
      } else {
        console.error('Keycloak instance is not available');
      }
    };

    const logout = async () => {
      if (kc) {
        try {
          await kc.logout();
        } catch (error) {
          console.error('Logout failed', error);
        }
      } else {
        console.error('Keycloak instance is not available');
      }
    };

    return {
      userData,
      login,
      logout,
      inverted: ref(false),
      menuOptions,
      projectMenuOptions,
      selectedLanguage,
      languageOptions
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