import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '../components/Dashboard'

export const Route = createFileRoute('/')({ ssr: false, component: Dashboard })
