import { Link } from "react-router";
import { useTitle } from "../lib/useTitle";

export function NotFound() {
  useTitle("Page not found");
  return (
    <section className="page-narrow">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Back to the home page</Link>
    </section>
  );
}
