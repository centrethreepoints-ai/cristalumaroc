import { CustomerList } from "../CustomerList";

export default async function ProspectsPage({ searchParams }: { searchParams: any }) {
  return <CustomerList status="prospect" searchParams={searchParams} />;
}
