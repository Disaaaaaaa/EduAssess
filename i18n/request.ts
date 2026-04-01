import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Using a single locale: Kazakh (kz)
  const locale = "kz";

  return {
    locale,
    messages: (await import("../messages/kz.json")).default as any,
  };
});
