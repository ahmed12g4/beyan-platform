import { getPlatformSettings } from '@/lib/actions/settings'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings()

  return (
    <div className="animate-fadeIn">
      <SettingsForm initialSettings={settings} />
    </div>
  )
}
