-- Allow 'DISPATCHED' in the orders status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('PENDING', 'PAID', 'PREPARING', 'READY', 'DISPATCHED', 'COMPLETED', 'CANCELLED')
);
