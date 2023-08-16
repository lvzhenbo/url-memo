<template>
  <NLayout content-style="height: 25rem;min-width: 45rem;">
    <NLayoutHeader bordered>
      <NSpace vertical class="p-4">
        <div class="flex">
          <NInputGroup class="!w-80 mr-3">
            <NInputGroupLabel>列表名称：</NInputGroupLabel>
            <NInput v-model:value="dynamicForm.name" @input="duplicateCheck" />
            <NButton type="primary" @click="handleSave"> {{ isNew ? '保存' : '修改' }} </NButton>
          </NInputGroup>
          <NSpace>
            <NButton @click="getCurrentUrlList"> 获取当前URL </NButton>
            <NButton type="error" @click="clearCurrentUrlList"> 清空当前URL </NButton>
          </NSpace>
        </div>
        <div class="flex">
          <NSelect
            v-model:value="selectValue"
            :options="options"
            class="!w-80 mr-3"
            clearable
            @update:value="handleSelect"
          />
          <NSpace>
            <NButton @click="handleOpenUrls"> 打开全部URL </NButton>
            <NButton type="error" @click="handleDeleteList"> 删除选中列表 </NButton>
          </NSpace>
        </div>
      </NSpace>
    </NLayoutHeader>
    <NLayoutContent position="absolute" class="!top-[109px]" :native-scrollbar="false">
      <NForm ref="formRef" class="p-4" label-placement="left" :model="dynamicForm">
        <NFormItem
          v-for="(item, index) in dynamicForm.urls"
          :key="index"
          :path="`urls[${index}].url`"
          :rule="{
            required: true,
            validator: validatorFunc,
            trigger: ['blur'],
          }"
        >
          <NInputGroup>
            <NInput v-model:value="item.url" clearable />
            <NButton
              quaternary
              type="error"
              :disabled="dynamicForm.urls.length === 1"
              @click="handleDeleteUrl(index)"
            >
              <NIcon>
                <MinusOutlined />
              </NIcon>
            </NButton>
            <NButton
              v-if="index === dynamicForm.urls.length - 1"
              quaternary
              type="primary"
              @click="hanldeAddUrl"
            >
              <NIcon>
                <PlusOutlined />
              </NIcon>
            </NButton>
          </NInputGroup>
        </NFormItem>
      </NForm>
    </NLayoutContent>
  </NLayout>
</template>

<script setup lang="ts">
  import type { SelectOption, FormInst, FormItemRule } from 'naive-ui';
  import { MinusOutlined, PlusOutlined } from '@vicons/antd';

  const message = useMessage();
  const selectValue = ref<null | string>(null);
  const options = ref<SelectOption[]>([]);
  const dynamicForm = reactive({
    name: '',
    urls: [{ url: '' }],
  });
  const isNew = ref(true);
  const formRef = ref<FormInst>();

  onMounted(() => {
    getCurrentUrlList();
    getOptions();
  });

  async function getCurrentUrlList() {
    selectValue.value = null;
    dynamicForm.name = '';
    const tabs = await chrome.tabs.query({});
    const urls: string[] = [];
    tabs.forEach((tab) => {
      if (tab.url) {
        if (!/^chrome/.test(tab.url)) {
          urls.push(tab.url);
        }
      }
    });
    if (urls.length) {
      dynamicForm.urls = urls.map((url) => ({ url }));
    }
  }

  function getOptions() {
    chrome.storage.local.get(null, (result) => {
      const keys = Object.keys(result);
      options.value = keys.map((key) => ({ label: key, value: key }));
    });
  }

  function clearCurrentUrlList() {
    dynamicForm.urls = [{ url: '' }];
    dynamicForm.name = '';
    isNew.value = true;
    selectValue.value = null;
  }

  function hanldeAddUrl() {
    dynamicForm.urls.push({ url: '' });
  }

  function handleDeleteUrl(index: number) {
    if (dynamicForm.urls.length === 1) return;
    console.log(dynamicForm.urls);
    dynamicForm.urls.splice(index, 1);
  }

  function handleOpenUrls() {
    dynamicForm.urls.forEach((item) => {
      chrome.tabs.create({ url: item.url, active: false });
    });
  }

  function handleSave() {
    if (!dynamicForm.name) {
      message.error('请输入列表名称');
      return;
    } else {
      formRef.value?.validate((errors) => {
        if (!errors) {
          console.log(dynamicForm.urls);

          chrome.storage.local.set({ [dynamicForm.name]: dynamicForm.urls }).then(() => {
            message.success(isNew.value ? '保存成功' : '修改成功');
            dynamicForm.name = '';
            isNew.value = true;
            getOptions();
          });
        } else {
          message.error('请检查是否为空、格式是否正确');
        }
      });
    }
  }

  function handleDeleteList() {
    if (!selectValue.value) {
      message.error('请选择要删除的列表');
      return;
    }
    chrome.storage.local.remove(selectValue.value).then(() => {
      message.success('删除成功');
      selectValue.value = null;
      dynamicForm.name = '';
      getOptions();
    });
  }

  function handleSelect(val: string) {
    if (!val) return;
    selectValue.value = val;
    chrome.storage.local.get(val, (result) => {
      dynamicForm.name = val;
      dynamicForm.urls = result[val];
      console.log(dynamicForm.urls);

      duplicateCheck();
    });
  }

  function duplicateCheck() {
    const { name } = dynamicForm;
    if (!name) return;
    chrome.storage.local.get(name, (result) => {
      if (result[name]) {
        isNew.value = false;
      } else {
        isNew.value = true;
      }
    });
  }

  function validatorFunc(rule: FormItemRule, value: string) {
    if (!value) {
      return new Error('请输入URL');
    } else if (
      !/^(((ht|f)tps?):\/\/)([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/.test(
        value,
      )
    ) {
      return new Error('请输入正确的URL');
    }
    return true;
  }
</script>

<style scoped></style>
