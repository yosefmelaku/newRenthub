import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Initialize stripe client. Falls back to a mock string in development sandbox mode.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key_renthub_12345', {
  apiVersion: '2025-01-27.accommodations' as any,
});

const isMockMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_mock');

/**
 * 1. POST /api/payments/checkout-session
 *
 * Initiates payments by looking up booking info server-side (preventing client price tampering).
 * Creates and returns a Stripe Checkout Session or returns a sandbox session object.
 */
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.payment_status === 'paid') {
      res.status(400).json({ error: 'This booking has already been paid.' });
      return;
    }

    const price = Number(booking.total_price || 0);
    if (price <= 0) {
      res.status(400).json({ error: 'Booking price must be greater than zero.' });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (isMockMode) {
      // In Mock Mode, return a simulated Checkout Session link redirecting back to our sandbox client handlers
      const mockSessionId = `mock_session_${Math.random().toString(36).substring(2, 12)}`;
      res.json({
        sessionId: mockSessionId,
        url: `${frontendUrl}/payment-redirect?session_id=${mockSessionId}&booking_id=${bookingId}&status=success`,
        isSandbox: true,
      });
      return;
    }

    // Live Stripe session setup
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Stay at ${booking.listing.title}`,
              description: `${booking.nights || 1} nights from ${booking.start_date.toISOString().split('T')[0]} to ${booking.end_date.toISOString().split('T')[0]}`,
              images: booking.listing.image ? [booking.listing.image] : [],
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        bookingId: booking.id,
        renterId: booking.renter_id || '',
      },
      success_url: `${frontendUrl}/payment-redirect?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}&status=success`,
      cancel_url: `${frontendUrl}/payment-redirect?booking_id=${bookingId}&status=cancel`,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      isSandbox: false,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create payment session.' });
  }
};

/**
 * 2. POST /api/payments/verify-sandbox
 *
 * For mock environment testing only. Directly processes complete billing changes for testing.
 */
export const verifySandbox = async (req: Request, res: Response): Promise<void> => {
  if (!isMockMode) {
    res.status(403).json({ error: 'Sandbox verification only available in dev mode.' });
    return;
  }

  const { bookingId, sessionId } = req.body;

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.payment_status === 'paid') {
      res.json({ success: true, message: 'Already paid.' });
      return;
    }

    // Atomic transaction to secure checkout updates
    await prisma.$transaction(async (tx) => {
      // Double check within transaction to prevent race conditions
      const currentBooking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!currentBooking || currentBooking.payment_status === 'paid') return;

      const transactionId = `MOCK_TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await tx.payment.create({
        data: {
          booking_id: bookingId,
          renter_id: booking.renter_id,
          amount: booking.total_price,
          cardholder_name: 'Sandbox User',
          card_number_masked: '•••• •••• •••• 4242',
          transaction_id: transactionId,
          payment_method: 'card_sandbox',
          status: 'success',
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { payment_status: 'paid', status: 'approved' },
      });
    });

    res.json({ success: true, message: 'Sandbox payment verified successfully.' });
  } catch (error) {
    console.error('Error verifying sandbox payment:', error);
    res.status(500).json({ error: 'Sandbox verification failed.' });
  }
};

/**
 * 3. POST /api/payments/webhook
 *
 * Accepts Stripe webhook notifications to verify and record payments asynchronously.
 * Enforces signature checks and database atomic guarantees.
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sigHeader = req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing stripe-signature or configuration.' });
    return;
  }

  let event: Stripe.Event;

  try {
    // rawBody contains req.rawBody buffer stored by express.json verification setup
    const rawBody = (req as any).rawBody || req.body;
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle transaction events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    const renterId = session.metadata?.renterId;

    if (!bookingId) {
      console.error('Webhook payload error: metadata.bookingId is missing.');
      res.status(400).json({ error: 'Metadata bookingId missing.' });
      return;
    }

    try {
      const transactionId = session.payment_intent as string || session.id;

      // Atomic transaction execution
      const result = await prisma.$transaction(async (tx) => {
        // Prevent duplicate processing - check if this transaction exists
        const existingPayment = await tx.payment.findUnique({
          where: { transaction_id: transactionId },
        });

        if (existingPayment) {
          console.log(`Payment with transactionId ${transactionId} already processed.`);
          return { alreadyProcessed: true };
        }

        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
        });

        if (!booking) {
          throw new Error(`Booking ${bookingId} not found.`);
        }

        if (booking.payment_status === 'paid') {
          console.log(`Booking ${bookingId} already settled.`);
          return { alreadyProcessed: true };
        }

        // 1. Log payment event
        const paymentRecord = await tx.payment.create({
          data: {
            booking_id: bookingId,
            renter_id: renterId || null,
            amount: session.amount_total ? new Prisma.Decimal(session.amount_total / 100) : null,
            cardholder_name: session.customer_details?.name || 'Cardholder',
            card_number_masked: '•••• •••• •••• ' + ((session as any).payment_method_details?.card?.last4 || 'xxxx'),
            transaction_id: transactionId,
            payment_method: session.payment_method_types?.[0] || 'card',
            status: 'success',
          },
        });

        // 2. Mark booking as paid & approved
        await tx.booking.update({
          where: { id: bookingId },
          data: { payment_status: 'paid', status: 'approved' },
        });

        return { paymentRecord };
      });

      console.log('Webhook checkout completed processed result:', result);
      res.json({ received: true });
      return;
    } catch (err: any) {
      console.error(`Database error during webhook transaction: ${err.message}`);
      res.status(500).json({ error: 'Webhook database updates failed.' });
      return;
    }
  }

  // Handle payment failures
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
      try {
        console.warn(`Payment failed for booking ${bookingId}: ${paymentIntent.last_payment_error?.message}`);
        
        // Log the failure in the payments table for transaction history audit
        await prisma.payment.create({
          data: {
            booking_id: bookingId,
            renter_id: paymentIntent.metadata?.renterId || null,
            amount: paymentIntent.amount ? new Prisma.Decimal(paymentIntent.amount / 100) : null,
            transaction_id: paymentIntent.id,
            status: 'failed',
          },
        });
      } catch (err: any) {
        console.error(`Failed to record payment failure: ${err.message}`);
      }
    }
    res.json({ received: true });
    return;
  }

  res.json({ received: true });
};

/**
 * 4. GET /api/payments/status/:bookingId
 *
 * Retrieves current settlement status of a booking to inform UI transitions.
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        payment_status: true,
        status: true,
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json({
      bookingId: booking.id,
      paymentStatus: booking.payment_status,
      status: booking.status,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Custom original handler (kept for database migration or compatibility triggers)
 */
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  const { bookingId, renterId, amount, cardholderName, cardNumberMasked } = req.body;
  const transactionId = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  try {
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          booking_id:         bookingId,
          renter_id:          renterId          ?? null,
          amount:             amount != null ? new Prisma.Decimal(Number(amount)) : null,
          cardholder_name:    cardholderName    ?? null,
          card_number_masked: cardNumberMasked  ?? null,
          transaction_id:     transactionId,
          status:             'success',
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data:  { payment_status: 'paid', status: 'approved' },
      }),
    ]);

    res.status(201).json({
      id:               payment.id,
      bookingId:        payment.booking_id,
      renterId:         payment.renter_id,
      amount:           payment.amount,
      cardholderName:   payment.cardholder_name,
      cardNumberMasked: payment.card_number_masked,
      transactionId:    payment.transaction_id,
      status:           payment.status,
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 5. POST /api/payments/confirm
 * 
 * New Ethiopian payment method confirmation endpoint.
 * Creates payment record for Ethiopian payment methods (Telebirr, CBE, etc.)
 */
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  const { bookingId, renterId, amount, paymentMethod } = req.body;
  
  if (!bookingId || !renterId || !amount || !paymentMethod) {
    res.status(400).json({ error: 'Missing required fields: bookingId, renterId, amount, paymentMethod' });
    return;
  }

  try {
    // Verify booking exists and isn't already paid
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.payment_status === 'paid') {
      res.status(400).json({ error: 'This booking has already been paid' });
      return;
    }

    // Generate Ethiopian-style transaction ID
    const transactionId = `ETH_${paymentMethod.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment and update booking atomically
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          booking_id:         bookingId,
          renter_id:          renterId,
          amount:             new Prisma.Decimal(Number(amount)),
          cardholder_name:    null, // Not applicable for Ethiopian methods
          card_number_masked: null, // Not applicable for Ethiopian methods
          transaction_id:     transactionId,
          payment_method:     paymentMethod,
          status:             'success',
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data:  { 
          payment_status: 'paid', 
          status: 'approved' 
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment confirmed successfully',
      payment: {
        id:            payment.id,
        bookingId:     payment.booking_id,
        transactionId: payment.transaction_id,
        amount:        payment.amount,
        paymentMethod: payment.payment_method,
        status:        payment.status,
        createdAt:     payment.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Payment confirmation failed', details: error.message });
  }
};
