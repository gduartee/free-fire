import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('id');

  if (!transactionId) {
    return Response.json({ error: 'ID da transação é obrigatório' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://multi.paradisepags.com/api/v1/query.php?action=get_transaction&id=${transactionId}`,
      {
        headers: { 'X-API-Key': process.env.api_key! },
      },
    );

    const data = await response.json();
    return Response.json({ status: data.status });
  } catch {
    return Response.json({ error: 'Erro ao consultar status' }, { status: 500 });
  }
}
