import { CustomerList } from "../CustomerList";

export default async function CustomersPage({ searchParams }: { searchParams: any }) {
  return <CustomerList status="customer" searchParams={searchParams} />;
}
