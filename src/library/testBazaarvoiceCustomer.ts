import "./bootstrap";
import { getBazaarvoiceCustomerEmail } from "../integrations/bazaarvoice.customer";

async function run() {
  const email =
    await getBazaarvoiceCustomerEmail(
      "302052595"
    );

  console.log(email);
}

run();