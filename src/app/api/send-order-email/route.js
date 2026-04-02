import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing');
      return NextResponse.json({ success: false, error: 'Email service configuration missing' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { orderId, userId, totalPrice, items } = await request.json();

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(price);
    };

    const itemsHtml = items.map(item => `
      <li>${item.products?.name || 'Unknown Product'} - Quantity: ${item.quantity} (Price: ${formatPrice(item.products?.price || 0)})</li>
    `).join('');

    const htmlContent = `
      <h1>New Order Received</h1>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Total Price:</strong> ${formatPrice(totalPrice)}</p>
      <h2>Items Ordered</h2>
      <ul>
        ${itemsHtml}
      </ul>
    `;

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'karthiksunki91@gmail.com',
      subject: 'New Order Received',
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
