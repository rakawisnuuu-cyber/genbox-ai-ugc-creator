import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <p className="font-satoshi text-xl font-bold tracking-[0.1em] text-foreground">GENBOX</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Logged in as <span className="text-foreground">{user?.email}</span>
      </p>
      <button
        onClick={signOut}
        className="mt-6 rounded-lg border border-border px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
