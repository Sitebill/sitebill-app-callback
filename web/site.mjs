// Site widgets of "Callback request": a form below the listing card (slot "property.detail")
// and a floating button over every page (slot "global"). Plain ESM, Vue is shared with the site.
const { defineComponent, h, ref, reactive, onMounted } = globalThis.__SB_HOST__.vue

// One settings request per page for both widgets.
let settingsPromise = null
function loadSettings(host) {
  settingsPromise ??= host.rest('settings').catch(() => ({ show_on_property: false, show_floating: false, button_text: '' }))
  return settingsPromise
}

/** The request form; `propertyId` attaches the listing the visitor is looking at. */
const RequestForm = defineComponent({
  name: 'CallbackRequestForm',
  props: { host: { type: Object, required: true }, propertyId: { type: Number, default: null } },
  setup(props) {
    const { host } = props
    const { UButton, UInput, UTextarea } = host.components
    const form = reactive({ name: host.user?.name ?? '', phone: '', comment: '', website: '' })
    const state = ref('idle') // idle | sending | done
    const error = ref('')

    async function submit() {
      if (state.value === 'sending') return
      error.value = ''
      if (!form.name.trim() || !form.phone.trim()) {
        error.value = host.t('error_required')
        return
      }
      state.value = 'sending'
      try {
        await host.rest('request', { method: 'POST', body: { ...form, property_id: props.propertyId } })
        state.value = 'done'
      } catch (e) {
        state.value = 'idle'
        const status = e?.response?.status ?? e?.statusCode
        error.value = status === 429 ? host.t('error_too_many') : status === 422 ? host.t('error_invalid') : host.t('error_failed')
      }
    }

    return () => state.value === 'done'
      ? h('p', { class: 'text-sm text-success' }, host.t('done'))
      : h('form', { class: 'space-y-2', onSubmit: (e) => { e.preventDefault(); submit() } }, [
          h(UInput, { modelValue: form.name, 'onUpdate:modelValue': (v) => { form.name = v }, placeholder: host.t('name'), class: 'w-full', autocomplete: 'name' }),
          h(UInput, { modelValue: form.phone, 'onUpdate:modelValue': (v) => { form.phone = v }, placeholder: host.t('phone'), type: 'tel', class: 'w-full', autocomplete: 'tel' }),
          h(UTextarea, { modelValue: form.comment, 'onUpdate:modelValue': (v) => { form.comment = v }, placeholder: host.t('comment'), rows: 2, class: 'w-full' }),
          // Honeypot: invisible for people, bots fill it in.
          h('input', { name: 'website', value: form.website, onInput: (e) => { form.website = e.target.value }, tabindex: -1, autocomplete: 'off', 'aria-hidden': 'true', style: 'position:absolute;left:-10000px;width:1px;height:1px;opacity:0' }),
          error.value ? h('p', { class: 'text-xs text-error' }, error.value) : null,
          h(UButton, { type: 'submit', block: true, loading: state.value === 'sending', label: host.t('send') }),
          h('p', { class: 'text-xs text-muted' }, host.t('privacy')),
        ])
  },
})

// Slot "property.detail": context = { propertyId }.
const CallbackForm = defineComponent({
  name: 'CallbackForm',
  props: { host: { type: Object, required: true }, context: { type: Object, default: () => ({}) } },
  setup(props) {
    const { host } = props
    const { UButton } = host.components
    const settings = ref(null)
    const open = ref(false)
    onMounted(async () => { settings.value = await loadSettings(host) })

    return () => settings.value?.show_on_property
      ? h('div', { class: 'rounded-2xl border border-(--ui-border) bg-(--ui-bg) p-5 max-w-xl' }, [
          h('div', { class: 'font-semibold text-highlighted' }, host.t('title')),
          h('p', { class: 'text-sm text-muted mt-1 mb-3' }, host.t('subtitle')),
          open.value
            ? h(RequestForm, { host, propertyId: Number(props.context.propertyId) || null })
            : h(UButton, { icon: 'i-lucide-phone-call', label: settings.value.button_text || host.t('button'), onClick: () => { open.value = true } }),
        ])
      : null
  },
})

// Slot "global": a floating button, off by default (setting "show_floating").
const CallbackFloatingButton = defineComponent({
  name: 'CallbackFloatingButton',
  props: { host: { type: Object, required: true }, context: { type: Object, default: () => ({}) } },
  setup(props) {
    const { host } = props
    const { UButton } = host.components
    const settings = ref(null)
    const open = ref(false)
    // Not in the admin panel, the account or the platform: the button is for site visitors.
    const hidden = /^\/(?:[a-z]{2}\/)?(admin|account|platform|auth)(\/|$)/.test(window.location.pathname)
    onMounted(async () => { if (!hidden) settings.value = await loadSettings(host) })

    return () => !hidden && settings.value?.show_floating
      ? h('div', { class: 'fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3' }, [
          open.value
            ? h('div', { class: 'w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-(--ui-border) bg-(--ui-bg) p-4 shadow-xl' }, [
                h('div', { class: 'flex items-center justify-between mb-2' }, [
                  h('span', { class: 'font-semibold text-highlighted' }, host.t('title')),
                  h(UButton, { icon: 'i-lucide-x', size: 'xs', color: 'neutral', variant: 'ghost', 'aria-label': host.t('close'), onClick: () => { open.value = false } }),
                ]),
                h(RequestForm, { host }),
              ])
            : null,
          h(UButton, { icon: 'i-lucide-phone-call', size: 'lg', class: 'rounded-full shadow-lg', label: settings.value.button_text || host.t('button'), onClick: () => { open.value = !open.value } }),
        ])
      : null
  },
})

export const widgets = { CallbackForm, CallbackFloatingButton }
