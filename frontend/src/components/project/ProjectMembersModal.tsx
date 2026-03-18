'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  ProjectMemberManager,
  type ProjectMemberCandidate,
} from './ProjectMemberManager';
import { type ProjectMemberRecord } from '../../lib/api/projects';

interface ProjectMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ProjectMemberRecord[];
  candidates: ProjectMemberCandidate[];
  adding?: boolean;
  removing?: boolean;
  onAddMembers: (employeeIds: string[]) => Promise<void> | void;
  onRemoveMember: (employeeId: string) => Promise<void> | void;
}

export function ProjectMembersModal({
  open,
  onOpenChange,
  members,
  candidates,
  adding = false,
  removing = false,
  onAddMembers,
  onRemoveMember,
}: ProjectMembersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
        </DialogHeader>

        <ProjectMemberManager
          members={members}
          candidates={candidates}
          adding={adding}
          removing={removing}
          onAddMembers={onAddMembers}
          onRemoveMember={onRemoveMember}
        />
      </DialogContent>
    </Dialog>
  );
}
