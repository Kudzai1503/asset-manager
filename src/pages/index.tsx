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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize user type from URL query on mount
  useEffect(() => {
    if (!router.isReady) return;

    const { type, registered } = router.query;
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

    // Show success message if coming from registration
    if (registered === "true") {
      setSuccessMessage("Account created successfully! Please sign in.");
      // Clear the query param after showing message
      router.replace("/", undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.type, router.query.registered]);

  // Update URL when user type changes
  const handleUserTypeChange = (newType: UserType) => {
    setUserType(newType);
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, type: newType },
    }, undefined, { shallow: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          setError(data.message || "Invalid email or password");
        } else if (response.status === 403) {
          setError(data.message || "Access denied");
        } else if (response.status === 400) {
          if (data.message?.includes("email")) {
            setEmailError(data.message);
          } else {
            setError(data.message || "Invalid input");
          }
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success - store session and redirect
      if (data.success && data.session) {
        // Store session tokens
        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("refresh_token", data.session.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect to dashboard (you can change this route)
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
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
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              setError("");
            }}
            placeholder="you@example.com"
            required
            error={emailError}
          />

          {/* Password Input */}
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
            required
          />

          {/* Success Message */}
          {successMessage && (
            <div className="text-sm text-green-600 text-center bg-green-50 border border-green-200 rounded-lg p-3" role="alert">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 text-center" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
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
            Don&#39;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-stone-800 hover:text-stone-900 transition-colors"
            >
              Sign up
            </Link>
          </p>
          <div className="pt-4 border-t border-stone-200">
            <p className="text-sm text-stone-600 mb-2">
              Are you from the Warranty Centre?
            </p>
            <Link
              href="/warranty-centre"
              className="inline-block px-4 py-2 bg-amber-100 text-stone-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
            >
              Access Warranty Centre
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
