import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Geist } from "next/font/google";

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
      className={`${geistSans.className} min-h-screen flex items-center justify-center bg-white dark:bg-black px-4 font-sans`}
    >
      <div className="w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white mb-2">
            Login
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selector */}
          <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg flex">
            <button
              type="button"
              onClick={() => handleUserTypeChange("user")}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                userType === "user"
                  ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange("admin")}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                userType === "admin"
                  ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black dark:text-white"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black dark:text-white"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            Sign in
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <a
            href="#"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
