import { redirect } from 'next/navigation';

// The PositionX landing page is now the live homepage at /.
// This route redirects there permanently so old links don't 404.
export default function PositioningPreviewRedirect() {
  redirect('/');
}
