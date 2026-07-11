import { createFileRoute } from '@tanstack/react-router'
import { Home } from '../components/Home'

export const Route = createFileRoute('/profiles/new')({
  ssr: false,
  component: Home,
})
