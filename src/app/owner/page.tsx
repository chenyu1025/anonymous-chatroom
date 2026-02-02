import { redirect } from 'next/navigation'

export default function OwnerRedirect() {
  redirect('/auth/owner')
}