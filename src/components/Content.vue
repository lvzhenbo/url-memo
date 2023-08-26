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
            :options="urlListOptions"
            class="!w-80 mr-3"
            clearable
            @update:value="handleSelect"
          />
          <NSpace>
            <NButton @click="handleBatchOpenUrl"> 打开全部URL </NButton>
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
            <NInputGroupLabel>URL：</NInputGroupLabel>
            <NInput v-model:value="item.url" clearable />
            <NInputGroupLabel>备注：</NInputGroupLabel>
            <NInput v-model:value="item.title" clearable />
            <NButton quaternary type="info" @click="handleOpenUrl(index)">
              <NIcon>
                <ExportOutlined />
              </NIcon>
            </NButton>
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
  import { MinusOutlined, PlusOutlined, ExportOutlined } from '@vicons/antd';

  const message = useMessage();
  const selectValue = ref<null | string>(null);
  const urlListOptions = ref<SelectOption[]>([]);
  const dynamicForm = reactive({
    name: '',
    urls: [{ url: '', title: '' }],
  });
  const isNew = ref(true);
  const formRef = ref<FormInst>();
  const urlReg =
    /^(((ht|f)tps?):\/\/)([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/;

  onMounted(() => {
    getCurrentUrlList();
    getOptions();
  });

  async function getCurrentUrlList() {
    selectValue.value = null;
    dynamicForm.name = '';
    const tabs = await chrome.tabs.query({});
    const urls: { url: string; title: string }[] = [];
    tabs.forEach((tab) => {
      if (tab.url && tab.title) {
        if (!/^chrome/.test(tab.url)) {
          urls.push({ url: tab.url, title: tab.title });
        }
      }
    });
    if (urls.length) {
      dynamicForm.urls = urls;
    }
  }

  function getOptions() {
    chrome.storage.local.get(null, (result) => {
      const keys = Object.keys(result);
      urlListOptions.value = keys.map((key) => ({ label: key, value: key }));
    });
  }

  function clearCurrentUrlList() {
    dynamicForm.urls = [{ url: '', title: '' }];
    dynamicForm.name = '';
    isNew.value = true;
    selectValue.value = null;
  }

  function hanldeAddUrl() {
    dynamicForm.urls.push({ url: '', title: '' });
  }

  function handleDeleteUrl(index: number) {
    if (dynamicForm.urls.length === 1) return;
    dynamicForm.urls.splice(index, 1);
  }

  function handleOpenUrl(index: number) {
    if (!dynamicForm.urls[index].url || !urlReg.test(dynamicForm.urls[index].url)) {
      message.error('请检查URL是否为空、格式是否正确');
    } else {
      openUrl(dynamicForm.urls[index].url);
    }
  }

  function openUrl(url: string) {
    chrome.tabs.create({ url, active: false });
  }

  function handleBatchOpenUrl() {
    formRef.value?.validate((errors) => {
      if (!errors) {
        dynamicForm.urls.forEach((item) => {
          openUrl(item.url);
        });
      } else {
        message.error('请检查URL是否为空、格式是否正确');
      }
    });
  }

  function handleSave() {
    if (!dynamicForm.name) {
      message.error('请输入列表名称');
    } else {
      formRef.value?.validate((errors) => {
        if (!errors) {
          chrome.storage.local
            // .set({ [dynamicForm.name]: JSON.stringify(dynamicForm.urls) })
            .set({ [dynamicForm.name]: toRaw(dynamicForm.urls) })
            .then(() => {
              message.success(isNew.value ? '保存成功' : '修改成功');
              dynamicForm.name = '';
              isNew.value = true;
              getOptions();
            });
        } else {
          message.error('请检查URL是否为空、格式是否正确');
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
      // dynamicForm.urls = JSON.parse(result[val]);
      // 向下兼容
      dynamicForm.urls = result[val].map((item: { url: string; title: string }) => ({
        url: item.url,
        title: item.title || '',
      }));
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
    } else if (!urlReg.test(value)) {
      return new Error('请输入正确的URL');
    }
    return true;
  }
</script>

<style scoped></style>
