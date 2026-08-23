export type MemberRole = 'child' | 'adult' | 'owner';
export type TaskStatus = 'pending' | 'completed' | 'deleted';

export interface FamilyTask {
  id: string;
  householdId: string;
  title: string;
  assignedMemberIds: string[];
  context: 'today' | 'before_leaving' | 'routine';
  status: TaskStatus;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface FamilyMember {
  id: string;
  householdId: string;
  name: string;
  role: MemberRole;
  order: number;
}
