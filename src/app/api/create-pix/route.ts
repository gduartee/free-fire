import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, description, customer } = body;

    const reference = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const response = await fetch('https://multi.paradisepags.com/api/v1/transaction.php', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.api_key!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        reference,
        productHash: process.env.product_hash!,
        customer: {
          name: customer.name,
          email: customer.email,
          document: customer.document,
          phone: customer.phone,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || 'Erro ao criar PIX' },
        { status: response.status },
      );
    }

    return Response.json({
      qr_code: data.qr_code,
      qr_code_base64: data.qr_code_base64,
      transaction_id: data.transaction_id,
      reference: data.id,
      expires_at: data.expires_at,
      amount: data.amount,
    });
  } catch {
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
