// Admin side of "Callback request": requests list with status, settings, and a dashboard widget.
const { defineComponent, h, ref, reactive, onMounted, computed } = globalThis.__SB_HOST__.vue

const LIST = `query CallbackRequests($status: String) {
  callbackRequests(status: $status) { id name phone comment property_title property_url lead_id status created_at }
  callbackStats { new total }
}`
const SET_STATUS = 'mutation CallbackSetStatus($id: ID!, $status: String!) { callbackSetStatus(id: $id, status: $status) { id status } }'
const SETTINGS = 'query CallbackSettings { callbackSettings { show_on_property show_floating button_text retention_days } }'
const SAVE = `mutation CallbackSaveSettings($input: CallbackSettingsInput!) {
  callbackSaveSettings(input: $input) { show_on_property show_floating button_text retention_days }
}`

const Requests = defineComponent({
  name: 'CallbackRequests',
  props: { host: { type: Object, required: true } },
  setup(props) {
    const { host } = props
    const { UButton, UBadge } = host.components
    const filter = ref('new')
    const rows = ref([])
    const stats = ref({ new: 0, total: 0 })
    const loading = ref(true)

    async function load() {
      loading.value = true
      try {
        const data = await host.gql(LIST, { status: filter.value === 'all' ? null : filter.value })
        rows.value = data.callbackRequests
        stats.value = data.callbackStats
      } finally {
        loading.value = false
      }
    }
    async function toggle(row) {
      await host.gql(SET_STATUS, { id: row.id, status: row.status === 'new' ? 'done' : 'new' })
      await load()
    }
    onMounted(load)

    const tab = (key, label) => h(UButton, {
      size: 'sm', variant: filter.value === key ? 'solid' : 'ghost', color: filter.value === key ? 'primary' : 'neutral', label,
      onClick: () => { filter.value = key; load() },
    })

    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'flex flex-wrap gap-2' }, [
        tab('new', `${host.t('filter_new')} (${stats.value.new})`),
        tab('done', host.t('filter_done')),
        tab('all', `${host.t('filter_all')} (${stats.value.total})`),
      ]),
      loading.value
        ? h('p', { class: 'text-sm text-muted' }, '…')
        : rows.value.length === 0
          ? h('p', { class: 'text-sm text-muted' }, host.t('empty'))
          : h('div', { class: 'divide-y divide-(--ui-border) rounded-xl border border-(--ui-border)' }, rows.value.map(r =>
              h('div', { key: r.id, class: 'p-4 flex flex-wrap items-start justify-between gap-3' }, [
                h('div', { class: 'min-w-0 space-y-1' }, [
                  h('div', { class: 'font-medium text-highlighted' }, [r.name, ' · ', h('a', { href: `tel:${r.phone}`, class: 'text-primary' }, r.phone)]),
                  r.comment ? h('p', { class: 'text-sm whitespace-pre-line' }, r.comment) : null,
                  r.property_title ? h('a', { href: r.property_url, target: '_blank', rel: 'noopener', class: 'text-xs text-primary hover:underline' }, r.property_title) : null,
                  h('div', { class: 'text-xs text-muted' }, host.formatDate(r.created_at)),
                ]),
                h('div', { class: 'flex items-center gap-2' }, [
                  h(UBadge, { color: r.status === 'new' ? 'warning' : 'success', variant: 'subtle', label: host.t(`status_${r.status}`) }),
                  r.lead_id ? h(UButton, { size: 'xs', variant: 'ghost', icon: 'i-lucide-kanban', to: host.localePath('/admin/deals'), label: host.t('open_crm') }) : null,
                  h(UButton, { size: 'xs', variant: 'outline', label: r.status === 'new' ? host.t('mark_done') : host.t('mark_new'), onClick: () => toggle(r) }),
                ]),
              ]))),
    ])
  },
})

const Settings = defineComponent({
  name: 'CallbackSettingsForm',
  props: { host: { type: Object, required: true } },
  setup(props) {
    const { host } = props
    const { UButton, UInput, USwitch } = host.components
    const form = reactive({ show_on_property: true, show_floating: false, button_text: '', retention_days: 180 })
    const saving = ref(false)
    onMounted(async () => Object.assign(form, (await host.gql(SETTINGS)).callbackSettings))

    async function save() {
      saving.value = true
      try {
        Object.assign(form, (await host.gql(SAVE, { input: { ...form, retention_days: Number(form.retention_days) } })).callbackSaveSettings)
        host.toast(host.t('saved'))
      } catch (e) {
        host.toast(String(e?.message ?? e), 'error')
      } finally {
        saving.value = false
      }
    }

    const field = (label, control, hint) => h('label', { class: 'block space-y-1' }, [
      h('span', { class: 'text-sm font-medium' }, label), control, hint ? h('span', { class: 'block text-xs text-muted' }, hint) : null,
    ])

    return () => h('form', { class: 'space-y-4 max-w-xl', onSubmit: (e) => { e.preventDefault(); save() } }, [
      h(USwitch, { modelValue: form.show_on_property, 'onUpdate:modelValue': (v) => { form.show_on_property = v }, label: host.t('set_on_property') }),
      h(USwitch, { modelValue: form.show_floating, 'onUpdate:modelValue': (v) => { form.show_floating = v }, label: host.t('set_floating') }),
      field(host.t('set_button_text'), h(UInput, { modelValue: form.button_text, 'onUpdate:modelValue': (v) => { form.button_text = v }, placeholder: host.t('button'), class: 'w-full' })),
      field(host.t('set_retention'), h(UInput, { modelValue: String(form.retention_days), 'onUpdate:modelValue': (v) => { form.retention_days = v }, type: 'number', min: 7, max: 3650, class: 'w-40' }), host.t('set_retention_hint')),
      h(UButton, { type: 'submit', loading: saving.value, label: host.t('save') }),
    ])
  },
})

const Home = defineComponent({
  name: 'CallbackHome',
  props: { host: { type: Object, required: true } },
  setup(props) {
    const { host } = props
    const { UButton } = host.components
    const tab = ref('requests')
    const tabs = computed(() => [['requests', host.t('tab_requests')], ['settings', host.t('tab_settings')]])

    return () => h('div', { class: 'space-y-5' }, [
      h('div', [
        h('h1', { class: 'text-2xl font-semibold text-highlighted' }, host.t('admin_title')),
        h('p', { class: 'text-sm text-muted' }, host.t('admin_about')),
      ]),
      h('div', { class: 'flex gap-2 border-b border-(--ui-border) pb-2' }, tabs.value.map(([key, label]) =>
        h(UButton, { key, size: 'sm', variant: tab.value === key ? 'soft' : 'ghost', color: tab.value === key ? 'primary' : 'neutral', label, onClick: () => { tab.value = key } }))),
      tab.value === 'requests' ? h(Requests, { host }) : h(Settings, { host }),
    ])
  },
})

// Slot "admin.dashboard": new requests counter.
const CallbackStats = defineComponent({
  name: 'CallbackStats',
  props: { host: { type: Object, required: true }, context: { type: Object, default: () => ({}) } },
  setup(props) {
    const { host } = props
    const { UButton } = host.components
    const stats = ref(null)
    onMounted(async () => { stats.value = (await host.gql(LIST, { status: 'new' })).callbackStats })

    return () => h('div', { class: 'rounded-2xl border border-(--ui-border) bg-(--ui-bg) p-5 flex items-center justify-between gap-4' }, [
      h('div', [
        h('div', { class: 'text-sm text-muted' }, host.t('widget_new')),
        h('div', { class: 'text-2xl font-semibold mt-1' }, stats.value ? String(stats.value.new) : '…'),
      ]),
      h(UButton, { size: 'sm', variant: 'outline', icon: 'i-lucide-arrow-right', to: host.localePath('/admin/x/sitebill.callback'), label: host.t('widget_open') }),
    ])
  },
})

export const pages = { '': Home }
export const widgets = { CallbackStats }
