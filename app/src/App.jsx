import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from './components/Header.jsx'
import { STORAGE_KEY, normalizeLanguage } from './i18n.js'
import { useLLMetadata } from './hooks/useLLMetadata.js'
import { Landing } from './pages/Landing.jsx'
import { LLDetail } from './pages/LLDetail.jsx'

export default function App() {
  const { i18n } = useTranslation()
  const lang = normalizeLanguage(i18n.resolvedLanguage)
  const { lls, bySlug, loading, error } = useLLMetadata(lang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Ignore storage access issues in restricted browser contexts.
    }
  }, [lang])

  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header lls={lls} />
        <div style={{ flex: 1, minHeight: 0 }}>
          {error ? (
            <ErrorBanner error={error} />
          ) : (
            <Routes>
              <Route path="/" element={<Landing lls={lls} loading={loading} />} />
              <Route path="/ll/:slug" element={<LLDetail bySlug={bySlug} loading={loading} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </div>
    </HashRouter>
  )
}

function ErrorBanner({ error }) {
  const { t } = useTranslation()

  return (
    <div style={{ padding: 40, color: '#bb3f11', fontSize: 14 }}>
      <strong>{t('app.metadataErrorTitle')}</strong>
      <br />
      {String(error.message || error)}
    </div>
  )
}
