import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="content not-found">
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>We couldn&apos;t find that page.</h1>
      <p>The link may be outdated or the page may have moved.</p>
      <Link className="secondary-button contextual-link" to="/">
        Back to Dashboard
      </Link>
    </main>
  );
}
