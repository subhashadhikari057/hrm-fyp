'use client';

import { useMemo, useState } from 'react';
import { type ProjectMemberRecord } from '../../lib/api/projects';
import { Button } from '../ui/button';

export interface ProjectMemberCandidate {
  id: string;
  label: string;
}

interface ProjectMemberManagerProps {
  members: ProjectMemberRecord[];
  candidates: ProjectMemberCandidate[];
  adding?: boolean;
  removing?: boolean;
  onAddMembers: (employeeIds: string[]) => Promise<void> | void;
  onRemoveMember: (employeeId: string) => Promise<void> | void;
}

export function ProjectMemberManager({
  members,
  candidates,
  adding = false,
  removing = false,
  onAddMembers,
  onRemoveMember,
}: ProjectMemberManagerProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const currentMemberIds = useMemo(
    () => new Set(members.map((member) => member.employeeId)),
    [members],
  );

  const availableCandidates = useMemo(
    () => candidates.filter((candidate) => !currentMemberIds.has(candidate.id)),
    [candidates, currentMemberIds],
  );

  const handleAddMember = async () => {
    if (!selectedEmployeeId) {
      return;
    }

    await onAddMembers([selectedEmployeeId]);
    setSelectedEmployeeId('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900">Add Member</p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <select
            className="h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            disabled={adding}
          >
            <option value="">Select employee</option>
            {availableCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <Button
            variant="blue"
            onClick={handleAddMember}
            disabled={adding || !selectedEmployeeId}
          >
            {adding ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Employee</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Code</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-600">
                  No members in this project yet.
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const fullName = `${member.employee?.firstName || ''} ${member.employee?.lastName || ''}`.trim();
                return (
                  <tr key={member.id}>
                    <td className="px-3 py-2 text-gray-900">{fullName || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{member.employee?.employeeCode || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{member.employee?.status || '-'}</td>
                    <td className="px-3 py-2">
                      <Button
                        variant="red"
                        size="sm"
                        disabled={removing}
                        onClick={() => onRemoveMember(member.employeeId)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
