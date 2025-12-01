import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Geist } from "next/font/google";
import Button from "@/components/buttons/Button";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { DashboardSkeleton } from "@/components/skeletons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

type User = {
  id: string;
  email: string;
  name: string;
  userType: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access_token");

    if (!storedUser || !accessToken) {
      router.push("/");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className={`${geistSans.className} font-sans`}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.userType === "admin";

  return (
    <div
      className={`${geistSans.className} min-h-screen bg-amber-50 font-sans`}
    >
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-stone-800">
                Asset Manager
              </h1>
              <p className="text-sm text-stone-600">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600">
                {isAdmin ? "Admin" : "User"}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? <AdminDashboard /> : <UserDashboard userId={user.id} />}
      </main>
    </div>
  );
}

