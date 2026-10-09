import { useEffect } from "react";

/** Sets the document title: "Rooms | Booker", or just "Booker" for the home page. */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Booker` : "Booker";
  }, [title]);
}
