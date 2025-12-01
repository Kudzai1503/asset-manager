import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Geist } from "next/font/google";
import Button from "@/components/buttons/Button";

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
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Sign in
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <a
            href="#"
            className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
