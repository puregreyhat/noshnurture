import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Redirect to the new unified auth page
  redirect('/auth');
}