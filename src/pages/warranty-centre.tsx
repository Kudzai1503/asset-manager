import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Geist } from "next/font/google";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";
import WarrantyCentreDashboard from "@/components/dashboard/WarrantyCentreDashboard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

type WarrantyCentreUser = {
  username: string;
};

export default function WarrantyCentre() {
  const router = useRouter();
  const [user, setUser] = useState<WarrantyCentreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("warranty_centre_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setShowLogin(false);
      } catch {
        localStorage.removeItem("warranty_centre_user");
        setShowLogin(true);
      }
    } else {
      setShowLogin(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsAuthenticating(true);

    try {
      // For now, using a simple hardcoded authentication
      // In production, this would connect to an actual auth service
      if (username === "admin" && password === "admin123") {
        const userData = { username };
        localStorage.setItem("warranty_centre_user", JSON.stringify(userData));
        setUser(userData);
        setShowLogin(false);
        setUsername("");
        setPassword("");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("warranty_centre_user");
    setUser(null);
    setShowLogin(true);
    setUsername("");
    setPassword("");
  };

  if (isLoading) {
    return (
      <div className={`${geistSans.className} min-h-screen bg-amber-50 flex items-center justify-center font-sans`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className={`${geistSans.className} min-h-screen bg-amber-50 flex items-center justify-center font-sans px-4`}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-stone-300/20 shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-stone-900 mb-2">
                Warranty Centre
              </h1>
              <p className="text-stone-600">
                Sign in to view registered warranties
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isAuthenticating}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isAuthenticating}
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-sm text-stone-600 mb-2">Demo Credentials:</p>
              <p className="text-sm font-mono text-stone-700">
                Username: <span className="font-bold">admin</span>
              </p>
              <p className="text-sm font-mono text-stone-700">
                Password: <span className="font-bold">admin123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${geistSans.className} min-h-screen bg-amber-50 font-sans`}>
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-stone-800">
                Warranty Centre
              </h1>
              <p className="text-sm text-stone-600">
                Welcome, {user?.username}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WarrantyCentreDashboard />
      </main>
    </div>
  );
}
