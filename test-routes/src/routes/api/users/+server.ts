export const GET = async ({ params }) => {
  return new Response(JSON.stringify({ id: params.id, name: 'Test User' }));
};

export const POST = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({ success: true, data: body }));
};