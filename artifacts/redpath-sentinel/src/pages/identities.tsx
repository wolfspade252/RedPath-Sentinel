import { useListUsers, useListGroups } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, User, ShieldAlert, Key } from "lucide-react";

export default function Identities() {
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: groups, isLoading: groupsLoading } = useListGroups();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Identities</h1>
        <p className="text-muted-foreground">Directory of discovered users and groups.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Username</TableHead>
                  <TableHead>Privilege</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id} className="border-border/50">
                      <TableCell className="font-medium font-mono">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          user.privilegeLevel === "admin" ? "border-destructive text-destructive" :
                          user.privilegeLevel === "high" ? "border-chart-2 text-chart-2" :
                          "border-primary text-primary"
                        }>
                          {user.privilegeLevel.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{user.accountType}</TableCell>
                      <TableCell>
                        {!user.mfaEnabled && (
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive border-none">No MFA</Badge>
                        )}
                        {user.mfaEnabled && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Secured</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-chart-4" /> Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Group Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : groups?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No groups found.</TableCell>
                  </TableRow>
                ) : (
                  groups?.map((group) => (
                    <TableRow key={group.id} className="border-border/50">
                      <TableCell className="font-medium font-mono">{group.name}</TableCell>
                      <TableCell>{group.memberCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                          {group.accessLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}