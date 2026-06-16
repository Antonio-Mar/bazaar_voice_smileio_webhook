type SmileCustomer = {
  id: number;
  email: string;
};

export async function getSmileCustomerByEmail(
  email: string
): Promise<SmileCustomer> {
  const endpoint = process.env.SMILE_API_URL;
  const apiKey = process.env.SMILE_API_KEY;

  const response = await fetch(
    `${endpoint}/customers?limit=1&email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to lookup Smile customer for ${email}`
    );
  }

  const data = await response.json();

  if (!data.customers?.length) {
    throw new Error(
      `Smile customer not found for ${email}`
    );
  }

  return data.customers[0];
}