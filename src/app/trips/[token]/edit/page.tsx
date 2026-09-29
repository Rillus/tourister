import { redirect } from "next/navigation";

/** Edit is now the plotter view on the trip page. */
export default async function EditTripRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/share/${token}?view=plotter`);
}
