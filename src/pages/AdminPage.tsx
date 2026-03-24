import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, RefreshCw, Shield, Plus, ToggleLeft, ToggleRight, Ticket, Clock, CalendarPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface InviteCode {
  id: string;
  code: string;
  is_active: boolean;
  uses_remaining: number | null;
  created_at: string;
}

interface TrialUser {
  user_id: string;
  email: string;
  created_at: string;
  trial_expires_at: string | null;
}

const AdminPage = () => {
  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Invite codes state
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newUses, setNewUses] = useState("");

  // Trials state
  const [trialUsers, setTrialUsers] = useState<TrialUser[]>([]);
  const [trialsLoading, setTrialsLoading] = useState(true);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { method: "GET" });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      setUsers(data.users ?? []);
    }
    setLoading(false);
  };

  const fetchCodes = async () => {
    setCodesLoading(true);
    const { data, error } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCodes((data as InviteCode[]) ?? []);
    }
    setCodesLoading(false);
  };

  const fetchTrialUsers = async () => {
    setTrialsLoading(true);
    // Get users from edge function and profiles from DB
    const [usersRes, profilesRes] = await Promise.all([
      supabase.functions.invoke("admin-users", { method: "GET" }),
      supabase.from("profiles").select("user_id, trial_expires_at, created_at"),
    ]);
    if (usersRes.data?.users && profilesRes.data) {
      const profileMap = new Map(profilesRes.data.map((p: any) => [p.user_id, p]));
      const merged: TrialUser[] = usersRes.data.users.map((u: AdminUser) => {
        const profile = profileMap.get(u.id) as any;
        return {
          user_id: u.id,
          email: u.email,
          created_at: u.created_at,
          trial_expires_at: profile?.trial_expires_at || null,
        };
      });
      setTrialUsers(merged);
    }
    setTrialsLoading(false);
  };

  const handleExtendTrial = async (userId: string, days: number) => {
    const user = trialUsers.find((u) => u.user_id === userId);
    const base = user?.trial_expires_at ? new Date(user.trial_expires_at) : new Date();
    const newExpiry = new Date(Math.max(base.getTime(), Date.now()) + days * 86400000);

    const { error } = await supabase
      .from("profiles")
      .update({ trial_expires_at: newExpiry.toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Extended by ${days} days` });
      setTrialUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, trial_expires_at: newExpiry.toISOString() } : u)),
      );
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCodes();
    fetchTrialUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      method: "POST",
      body: { action: "delete", user_id: userId },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "User deleted" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
    setDeleting(null);
  };

  const handleAddCode = async () => {
    const code = newCode.trim().toUpperCase();
    if (!code) return;
    const usesRemaining = newUses ? parseInt(newUses) : null;
    const { error } = await supabase.from("invite_codes").insert({
      code,
      is_active: true,
      uses_remaining: usesRemaining,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Code added" });
      setNewCode("");
      setNewUses("");
      fetchCodes();
    }
  };

  const toggleCode = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("invite_codes").update({ is_active: !currentActive }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c)));
    }
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase.from("invite_codes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="trials">Trials</TabsTrigger>
          <TabsTrigger value="codes">Invite Codes</TabsTrigger>
        </TabsList>

        {/* ─── USERS TAB ─── */}
        <TabsContent value="users">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-20">No users found.</p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmt(u.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmt(u.last_sign_in_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setUserToDelete(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── TRIALS TAB ─── */}
        <TabsContent value="trials">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={fetchTrialUsers} disabled={trialsLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${trialsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {trialsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : trialUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-20">No users found.</p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Signup</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Extend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialUsers.map((u) => {
                    const expired = u.trial_expires_at ? new Date() > new Date(u.trial_expires_at) : false;
                    const daysLeft = u.trial_expires_at
                      ? Math.ceil((new Date(u.trial_expires_at).getTime() - Date.now()) / 86400000)
                      : null;
                    return (
                      <TableRow key={u.user_id} className={expired ? "opacity-60" : ""}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{fmt(u.created_at)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{fmt(u.trial_expires_at)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              expired ? "text-destructive" : "text-primary"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {expired ? "Expired" : `${daysLeft}d left`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="1"
                              placeholder="7"
                              value={extendDays[u.user_id] || ""}
                              onChange={(e) => setExtendDays((prev) => ({ ...prev, [u.user_id]: e.target.value }))}
                              className="h-7 w-16 text-xs"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const days = parseInt(extendDays[u.user_id] || "7") || 7;
                                handleExtendTrial(u.user_id, days);
                              }}
                            >
                              <CalendarPlus className="h-3 w-3 mr-1" />
                              +days
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── INVITE CODES TAB ─── */}
        <TabsContent value="codes">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="NEW-CODE"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="max-w-[200px]"
            />
            <Input
              placeholder="Uses (∞)"
              type="number"
              min="1"
              value={newUses}
              onChange={(e) => setNewUses(e.target.value)}
              className="max-w-[100px]"
            />
            <Button size="sm" onClick={handleAddCode} disabled={!newCode.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={fetchCodes} disabled={codesLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${codesLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {codesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : codes.length === 0 ? (
            <p className="text-muted-foreground text-center py-20">No invite codes.</p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses Left</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((c) => (
                    <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-mono font-medium">{c.code}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${c.is_active ? "text-green-500" : "text-muted-foreground"}`}
                        >
                          <Ticket className="h-3 w-3" />
                          {c.is_active ? "Active" : "Disabled"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.uses_remaining === null ? "∞" : c.uses_remaining}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmt(c.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleCode(c.id, c.is_active)}
                            title={c.is_active ? "Disable" : "Enable"}
                          >
                            {c.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteCode(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete user dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus user?</AlertDialogTitle>
            <AlertDialogDescription>
              User <span className="font-medium text-foreground">{userToDelete?.email}</span> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  handleDelete(userToDelete.id);
                  setUserToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting === userToDelete?.id}
            >
              {deleting === userToDelete?.id ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;
