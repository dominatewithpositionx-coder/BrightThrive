import { redirect } from 'next/navigation';

// Legacy /auth route — replaced by /onboarding and /login
export default function AuthPage() {
  redirect('/onboarding');
}
