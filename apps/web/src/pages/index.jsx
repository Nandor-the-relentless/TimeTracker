
// apps/web/src/pages/index.jsx
// WHY: Keep your Layout + routes; guard once with RequireAuth.
import Layout from './Layout.jsx'
import Dashboard from './Dashboard'
import TimeSheet from './TimeSheet'
import PTO from './PTO'
import AccessDenied from './AccessDenied'
import NotFound from './NotFound'
import Team from './Team'
import Reports from './Reports'
import Admin from './Admin'
import DeveloperDocs from './DeveloperDocs'
import RequireAuth from '@/components/auth/RequireAuth.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
import { getCurrentPageName } from '@/utils'

function PagesContent() {
  const location = useLocation()
  const currentPage = getCurrentPageName(location.pathname)
  
  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/timesheet" element={<TimeSheet />} />
        <Route path="/pto" element={<PTO />} />
        <Route path="/team" element={<Team />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/developer-docs" element={<DeveloperDocs />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default function Pages() {
  return (
    <RequireAuth>
      <PagesContent />
    </RequireAuth>
  )
}
