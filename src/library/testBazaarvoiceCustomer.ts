import "./bootstrap";
import { getBazaarvoiceCustomerEmail } from "../integrations/bazaarvoice.customer";

async function run() {
  const email =
    await getBazaarvoiceCustomerEmail(
      "303587536", 
    );

  console.log(email);
}

run();