import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Geist } from "next/font/google";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";
// AG2003k - AG2003k

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

type UserType = "admin" | "user";

export default function Login() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Initialize user type from URL query on mount
  useEffect(() => {
    if (!router.isReady) return;

    const { type } = router.query;
    const typeParam = Array.isArray(type) ? type[0] : type;

    if (typeParam === "admin" || typeParam === "user") {
      setUserType(typeParam);
    } else if (!typeParam) {
      // If no query param, set default and update URL
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, type: "user" },
      }, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.type]);

  // Update URL when user type changes
  const handleUserTypeChange = (newType: UserType) => {
    setUserType(newType);
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, type: newType },
    }, undefined, { shallow: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { userType, email, password });
  };

  return (
    <div
      className={`${geistSans.className} min-h-screen flex items-center justify-center bg-amber-50 px-4 font-sans`}
    >
      <div className="w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800 mb-2">
            Login
          </h1>
          <p className="text-sm text-stone-600">
            Sign in to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selector */}
          <div className="bg-amber-100 p-1 rounded-lg flex">
            <Button
              type="button"
              variant={userType === "user" ? "toggle-active" : "toggle"}
              onClick={() => handleUserTypeChange("user")}
              fullWidth
              className="flex-1"
            >
              User
            </Button>
            <Button
              type="button"
              variant={userType === "admin" ? "toggle-active" : "toggle"}
              onClick={() => handleUserTypeChange("admin")}
              fullWidth
              className="flex-1"
            >
              Admin
            </Button>
          </div>

          {/* Email Input */}
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          {/* Password Input */}
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {/* Submit Button */}
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Sign in
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          <a
            href="#"
            className="block text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            Forgot password?
          </a>
          <p className="text-sm text-stone-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-stone-800 hover:text-stone-900 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
