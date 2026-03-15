import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, RefreshCw, Shield, Plus, ToggleLeft, ToggleRight, Ticket } from "lucide-react";
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

  useEffect(() => { fetchUsers(); fetchCodes(); }, []);

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      method: "DELETE",
      body: { user_id: userId },
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
      setCodes((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !currentActive } : c));
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
    d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setUserToDelete(u)}>
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

        {/* ─── INVITE CODES TAB ─── */}
        <TabsContent value="codes">
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="NEW-CODE" value={newCode} onChange={(e) => setNewCode(e.target.value)} className="max-w-[200px]" />
            <Input placeholder="Uses (∞)" type="number" min="1" value={newUses} onChange={(e) => setNewUses(e.target.value)} className="max-w-[100px]" />
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
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.is_active ? "text-green-500" : "text-muted-foreground"}`}>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCode(c.id, c.is_active)} title={c.is_active ? "Disable" : "Enable"}>
                            {c.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteCode(c.id)}>
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
              onClick={() => { if (userToDelete) { handleDelete(userToDelete.id); setUserToDelete(null); } }}
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
