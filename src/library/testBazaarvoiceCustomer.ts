import "./bootstrap";
import { getBazaarvoiceCustomerEmail } from "../integrations/bazaarvoice.customer";
import type { Brand } from "../config/smileConfig";

async function run() {
  const email =
    await getBazaarvoiceCustomerEmail(
      "303587536", 
      brand
    );

  console.log(email);
}

run();