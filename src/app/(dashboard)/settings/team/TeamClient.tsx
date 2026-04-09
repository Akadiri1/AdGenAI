"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Users, UserPlus, Crown, Shield, Eye, Trash2, Lock, ArrowLeft, Pencil, Check, X, Copy } from "lucide-react";

type Member = {
  id: string;
  role: string;
  inviteStatus: string;
  user: { id: string; name: string | null; email: string | null };
};

type Team = {
  id: string;
  name: string;
  members: Member[];
};

const ROLE_ICONS: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: Users, viewer: Eye };
const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" };

export function TeamClient({
  team: initialTeam, myRole, canManageTeam, maxSeats, userId,
}: {
  team: Team | null; myRole: string | null; canManageTeam: boolean; maxSeats: number; userId: string;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [team, setTeam] = useState(initialTeam);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(team?.name ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function createTeam() {
    if (!teamName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Team created");
      router.refresh();
    } catch (err) { error((err as Error).message); }
    finally { setLoading(false); }
  }

  async function invite() {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    setInviteLink(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.inviteUrl) {
        setInviteLink(data.inviteUrl);
        success(data.message);
      } else {
        success(`Invite email sent to ${inviteEmail}`);
      }
      setInviteEmail("");
      router.refresh();
    } catch (err) { error((err as Error).message); }
    finally { setLoading(false); }
  }

  async function renameTeam() {
    if (!team || !newName.trim()) return;
    try {
      const res = await fetch(`/api/team/${team.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Team renamed");
      setEditingName(false);
      router.refresh();
    } catch (err) { error((err as Error).message); }
  }

  async function deleteTeam() {
    if (!team) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${team.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Team deleted");
      router.refresh();
    } catch (err) { error((err as Error).message); }
    finally { setLoading(false); }
  }

  function copyInviteLink() {
    if (inviteLink) navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function removeMember(memberId: string) {
    try {
      const res = await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Member removed");
      router.refresh();
    } catch (err) { error((err as Error).message); }
  }

  if (!canManageTeam) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <div className="rounded-3xl border-2 border-warning/20 bg-warning/5 p-10 text-center">
          <Lock className="mx-auto h-12 w-12 text-warning mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Team collaboration</h1>
          <p className="text-text-secondary mb-6">Invite team members, assign roles, and collaborate on ads together. Available on Business and Enterprise plans.</p>
          <Link href="/settings/billing" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">
            Upgrade to Business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Team</h1>
        <p className="text-text-secondary">Invite members and collaborate on ads</p>
      </div>

      {!team ? (
        <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm text-center">
          <Users className="mx-auto h-12 w-12 text-text-secondary mb-4" />
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">Create your team</h2>
          <input
            type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name" className="mx-auto mb-4 w-full max-w-xs rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm text-center outline-none focus:border-primary"
          />
          <button onClick={createTeam} disabled={loading || !teamName.trim()}
            className="flex mx-auto h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            Create team
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg border-2 border-primary bg-white px-3 py-1.5 text-sm font-bold outline-none" autoFocus />
                  <button onClick={renameTeam} className="flex h-8 w-8 items-center justify-center rounded-lg bg-success text-white"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingName(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-text-primary">{team.name}</h2>
                  {myRole === "owner" && (
                    <button onClick={() => { setNewName(team.name); setEditingName(true); }}
                      className="text-text-secondary hover:text-text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{team.members.length} / {maxSeats === 999 ? "∞" : maxSeats} seats</span>
                {myRole === "owner" && (
                  confirmDelete ? (
                    <div className="flex gap-1.5">
                      <button onClick={deleteTeam} disabled={loading}
                        className="flex h-8 items-center gap-1 rounded-lg bg-danger px-2.5 text-xs font-semibold text-white hover:bg-danger/90 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> Yes, delete
                      </button>
                      <button onClick={() => setConfirmDelete(false)}
                        className="flex h-8 items-center rounded-lg border border-black/10 px-2.5 text-xs font-semibold">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)}
                      className="text-danger hover:bg-danger/10 rounded-lg p-1.5"><Trash2 className="h-4 w-4" /></button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-2">
              {team.members.map((m) => {
                const RoleIcon = ROLE_ICONS[m.role] ?? Users;
                const isMe = m.user.id === userId;
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-secondary">
                        <RoleIcon className="h-4 w-4 text-text-secondary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {m.user.name ?? m.user.email} {isMe && <span className="text-xs text-text-secondary">(you)</span>}
                        </div>
                        <div className="text-xs text-text-secondary">{m.user.email} · {ROLE_LABELS[m.role]}</div>
                      </div>
                    </div>
                    {!isMe && (myRole === "owner" || myRole === "admin") && (
                      <button onClick={() => removeMember(m.id)} className="text-danger hover:bg-danger/10 rounded-lg p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(myRole === "owner" || myRole === "admin") && (
            <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <h3 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Invite member
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com" className="flex-1 rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={invite} disabled={loading || !inviteEmail.includes("@")}
                  className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                  <UserPlus className="h-4 w-4" /> Invite
                </button>
              </div>

              {/* Invite link fallback (when email fails to send) */}
              {inviteLink && (
                <div className="mt-3 rounded-xl border-2 border-warning/20 bg-warning/5 p-3">
                  <div className="text-xs font-semibold text-text-primary mb-1.5">Email couldn&apos;t be sent. Share this link instead:</div>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-lg bg-white border border-black/10 px-3 py-2 text-xs font-mono text-text-primary break-all">
                      {inviteLink}
                    </code>
                    <button onClick={copyInviteLink} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                      {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
