import Link from "next/link";
import { Button } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-app-primary to-blue-700 px-4 py-12 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-white/20 p-3">
          <div className="h-full w-full rounded-full bg-white/30" />
        </div>
        
        <h1 className="mt-6 text-3xl font-bold">Save with Jenny</h1>
        <p className="mt-3 text-lg text-white/90">
          Digitize thrift savings (ajo/esusu/adashe) with secure group & personal savings, contributions, payouts, and transparency.
        </p>
        
        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">₦0</div>
            <div className="mt-1 text-sm text-white/80">Total Saved</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">0</div>
            <div className="mt-1 text-sm text-white/80">Active Groups</div>
          </div>
        </div>
        
        <div className="mt-10 space-y-4">
          <Link href="/auth/sign-up" className="block">
            <Button className="w-full bg-white text-app-primary hover:bg-white/90">
              Create Account
            </Button>
          </Link>
          
          <Link href="/auth/sign-in" className="block">
            <Button variant="outline" className="w-full border-white text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold">How It Works</h2>
          
          <div className="mt-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Join or Create Groups</h3>
                <p className="mt-1 text-sm text-white/80">
                  Create your own savings group or join existing ones with friends and family.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Contribute Regularly</h3>
                <p className="mt-1 text-sm text-white/80">
                  Make automated contributions on schedule. Track your payments in real-time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Receive Payouts</h3>
                <p className="mt-1 text-sm text-white/80">
                  Get your turn to receive payouts based on group cycles. All transactions are secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 w-full max-w-md text-center text-sm text-white/70">
        © {new Date().getFullYear()} Save with Jenny. All rights reserved.
      </div>
    </div>
  );
}