import { ref, computed, watch } from 'vue'
import { en, ar, defaultLocale } from '../i18n/locales.js'

const STORAGE_KEY = 'portfolio-locale'

function readStoredLocale() {
  if (typeof window === 'undefined') return defaultLocale
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'ar' ? 'ar' : defaultLocale
}

const locale = ref(readStoredLocale())

const dictFor = computed(() => (locale.value === 'ar' ? ar : en))
const isAr = computed(() => locale.value === 'ar')
const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))

function lookup(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), dict)
}

function t(path) {
  const key = String(path)
  const found = lookup(dictFor.value, key)
  if (found != null) return found
  const fallback = lookup(en, key)
  return fallback != null ? fallback : key
}

function toggleLocale() {
  locale.value = locale.value === 'en' ? 'ar' : 'en'
}

watch(
  locale,
  (val) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, val)
    document.documentElement.lang = val === 'ar' ? 'ar' : 'en'
    document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr'
    document.title = lookup(dictFor.value, 'titles.site') || document.title
  },
  { immediate: true }
)

export function useLocale() {
  return {
    locale,
    isAr,
    dir,
    t,
    toggleLocale,
  }
}

export default useLocale