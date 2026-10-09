import { useQuery } from "@tanstack/react-query";
import { api, DataResponse } from "../api/client";
import type { Branding } from "../api/types";

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: () =>
      api<DataResponse<Branding>>("/public/branding").then(
        (response) => response.data,
      ),
    staleTime: Infinity,
  });
}
