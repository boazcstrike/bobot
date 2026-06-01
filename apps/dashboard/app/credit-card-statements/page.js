import { redirect } from "next/navigation";

export default function CreditCardStatementsPage() {
  redirect("/expenses?tab=statements");
}
