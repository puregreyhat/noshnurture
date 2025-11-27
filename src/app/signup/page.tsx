import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // Redirect to the new unified auth page
  redirect('/auth');
}