import Header from '@/components/layout/Header'

export default function SettingsPage() {
  return (
    <>
      <Header title="General Settings" subtitle="System configuration and preferences" />
      <div className="p-6">
        <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          General settings and application configuration will be available here soon.
          <br /><br />
          Note: Team members and core Roles have been moved to the dedicated 'Team' module on the sidebar.
        </div>
      </div>
    </>
  )
}
