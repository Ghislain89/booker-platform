import { ContactForm } from "../components/ContactForm";
import { useT } from "../lib/preferences";
import { useTitle } from "../lib/useTitle";

export function Contact() {
  const t = useT();
  useTitle(t("nav.contact"));
  return (
    <div className="page-narrow">
      <ContactForm headingLevel={1} />
    </div>
  );
}
