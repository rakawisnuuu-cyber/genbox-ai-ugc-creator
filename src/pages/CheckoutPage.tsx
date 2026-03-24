import { useEffect } from "react";

const CLICKY_URL = "https://clicky.id/payment/purchase/69c292304cd72de65651417b";

const CheckoutPage = () => {
  useEffect(() => {
    window.location.href = CLICKY_URL;
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Redirecting to payment...</p>
      </div>
    </div>
  );
};

export default CheckoutPage;
