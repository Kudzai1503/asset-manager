import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Geist } from "next/font/google";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

type UserType = "admin" | "user";

export default function Register() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

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

  // Validate password match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          setEmailError(data.message || "User with this email already exists");
        } else if (response.status === 400) {
          if (data.message?.includes("email")) {
            setEmailError(data.message);
          } else if (data.message?.includes("Password")) {
            setPasswordError(data.message);
          } else {
            setError(data.message || "Invalid input");
          }
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to login page
      if (data.success) {
        router.push("/?registered=true");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${geistSans.className} min-h-screen flex items-center justify-center bg-amber-50 px-4 py-8 font-sans`}
    >
      <div className="w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800 mb-2">
            Create Account
          </h1>
          <p className="text-sm text-stone-600">
            Join Asset Manager to get started
          </p>
        </div>

        {/* Registration Form */}
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

          {/* Name Input */}
          <Input
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            helperText="Must be at least 8 characters"
          />

          {/* Confirm Password Input */}
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError("");
              setError("");
            }}
            placeholder="••••••••"
            required
            error={passwordError}
          />

          {/* General Error Message */}
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
            disabled={!!passwordError || isLoading || !!error}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-stone-600">
            Already have an account?{" "}
            <Link
              href="/"
              className="font-medium text-stone-800 hover:text-stone-900 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

