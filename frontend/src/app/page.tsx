"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/feed");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-1.5 mb-8 text-sm font-semibold tracking-wide text-primary-600 dark:text-primary-400 uppercase bg-primary-50 dark:bg-primary-900/30 rounded-full border border-primary-200 dark:border-primary-800">
              AI-Powered Professional Network
            </div>
            <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 font-heading mb-8 leading-tight">
              Connect the <span className="gradient-text">Future of Business</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-500 dark:text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
              Join a global ecosystem of industry leaders, innovators, and entrepreneurs scale their professional presence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register">
                <Button size="lg" className="h-16 px-12 text-xl rounded-2xl w-full sm:w-auto">
                  Start Growing Now
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-16 px-12 text-xl rounded-2xl w-full sm:w-auto">
                  Explore Platform
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] animate-blob"></div>
          <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-[120px] animate-blob delay-2000"></div>
          <div className="absolute -bottom-20 left-1/3 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-[120px] animate-blob delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div className="max-w-2xl">
              <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-6 tracking-tight text-gray-900 dark:text-gray-100">
                The ultimate toolkit for <br/>professional growth
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                We provide the infrastructure so you can focus on building meaningful business relationships.
              </p>
            </div>
            <Link href="/features">
              <Button variant="ghost" className="group">
                View all features
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <Card 
              title="Business Profiles" 
              subtitle="Verified Presence"
              className="p-6"
            >
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-4">Showcase your services with high-fidelity profiles, track your reputation points, and earn industry verification badges.</p>
            </Card>
            <Card 
              title="Smart Communities" 
              subtitle="Industry Circles"
              className="p-6"
            >
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-4">Join specialized groups optimized with AI to match you with peers, knowledge bases, and collaborative projects.</p>
            </Card>
            <Card 
              title="Real-time Insights" 
              subtitle="AI Analytics"
              className="p-6"
            >
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-4">Stay ahead with live trend predictions, sentiment analysis, and personalized strategy recommendations.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Ready to revolutionize your <br/><span className="gradient-text">professional journey?</span>
          </h2>
          <Link href="/register">
            <Button size="lg" className="px-12 py-6 text-lg rounded-2xl">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
