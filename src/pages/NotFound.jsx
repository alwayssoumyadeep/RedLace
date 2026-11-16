import { EmptyState } from '../components/ui';
import { usePageReady, useTitle } from '../context/PageTransition';

export default function NotFound() {
  usePageReady();
  useTitle('Page not found — Redlace');
  return (
    <div className="wrap">
      <EmptyState title="This page has walked off" text="The link may be old or mistyped. Every pair we sell is in the shop." to="/shop" action="Go to the shop" />
    </div>
  );
}
