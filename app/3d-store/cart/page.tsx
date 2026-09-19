import CartPageClient from "@/components/CartPageClient";
import { pageMetadata } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getCustomerOrders } from "@/lib/data";

export const metadata = pageMetadata("/3d-store/cart/", "Your Cart", "Review your selected 3D models and check out in one payment.");

export default async function CartPage() {
  const customer = await getCustomer();
  const orders = customer ? await getCustomerOrders(customer.id) : [];
  const alreadyOwnedIds = orders.filter((o) => o.status === "paid" || o.status === "completed").map((o) => o.product.id);

  return <>
    <section className="page-hero compact"><div className="container">
      <p className="eyebrow">3D Store</p>
      <h1>Your Cart</h1>
      <p>Review your selected models, then check out together with one ABA QR payment.</p>
    </div></section>
    <section className="section pt-0"><div className="container">
      <CartPageClient signedIn={Boolean(customer)} defaultName={customer?.fullName || ""} defaultEmail={customer?.email || ""} alreadyOwnedIds={alreadyOwnedIds} />
    </div></section>
  </>;
}
